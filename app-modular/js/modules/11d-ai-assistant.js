/* ============================================================
   Google Gemini AI Integration Engine (محرك الذكاء الاصطناعي)
   ============================================================ */

function renderAiMarkdownToHtml(md){
  if(!md) return '';
  let s = escapeHtml(String(md).trim());

  // Bold: **text**
  s = s.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Italic: *text*
  s = s.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Code / Badges: `text`
  s = s.replace(/`([^`]+)`/g, '<code class="mono" style="background:rgba(124,58,237,0.08);color:#6d28d9;padding:1px 5px;border-radius:4px;font-size:12px;font-weight:600;">$1</code>');

  // Headings
  s = s.replace(/^###\s*(.*?)$/gm, '<h4 style="margin:14px 0 6px 0;font-size:13.5px;color:var(--ink);font-weight:800;display:flex;align-items:center;gap:6px;"><span style="color:#7c3aed;">▸</span> $1</h4>');
  s = s.replace(/^##\s*(.*?)$/gm, '<h3 style="margin:16px 0 8px 0;font-size:15px;color:var(--primary);font-weight:800;border-bottom:1px dashed var(--line);padding-bottom:4px;">$1</h3>');
  s = s.replace(/^#\s*(.*?)$/gm, '<h2 style="margin:18px 0 10px 0;font-size:16px;color:var(--ink);font-weight:900;">$1</h2>');

  // List bullets: * or - or •
  s = s.replace(/^[\*\-•]\s*(.*?)$/gm, '<div style="display:flex;gap:6px;align-items:flex-start;margin:3px 0;padding-right:4px;"><span style="color:#7c3aed;font-size:13px;line-height:1.5;">•</span><div style="flex:1;line-height:1.5;">$1</div></div>');

  // Numbered items: 1. text
  s = s.replace(/^(\d+)\.\s*(.*?)$/gm, '<div style="display:flex;gap:6px;align-items:flex-start;margin:4px 0;padding-right:4px;"><span class="mono font-bold" style="color:#7c3aed;font-size:12px;min-width:18px;line-height:1.6;">$1.</span><div style="flex:1;line-height:1.5;">$2</div></div>');

  // Paragraphs & newlines
  s = s.replace(/\n\n+/g, '<div style="height:10px;"></div>');
  s = s.replace(/\n/g, '<br>');

  return s;
}

async function callGeminiAI(options = {}){
  const cfg = getGeminiSettings();
  const apiKey = (options.apiKey || cfg.apiKey || '').trim();
  if(!apiKey){
    const err = new Error('لم يتم إدخال مفتاح Google Gemini API بعد. يرجى ضبط المفتاح في قسم الإعدادات > الذكاء الاصطناعي.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const model = options.model || cfg.model || 'gemini-3.5-flash';
  const temperature = options.temperature != null ? options.temperature : (cfg.temperature ?? 0.7);
  const maxTokens = options.maxTokens || 2048;
  const systemPrompt = options.systemPrompt || cfg.systemInstruction || DEFAULT_GEMINI_SETTINGS.systemInstruction;

  let contents = [];
  if(Array.isArray(options.contents) && options.contents.length > 0){
    contents = options.contents;
  } else if(options.prompt){
    contents = [{ role: 'user', parts: [{ text: options.prompt }] }];
  } else {
    throw new Error('لم يتم تحديد نص للطلب (prompt is missing)');
  }

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: maxTokens
    }
  };

  if(systemPrompt){
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
  } catch(netErr){
    throw new Error('تعذر الاتصال بخوادم Google Gemini. يرجى التحقق من اتصال الإنترنت.');
  }

  const data = await response.json().catch(() => ({}));

  if(!response.ok){
    const apiError = data.error || {};
    const errMsg = apiError.message || 'خطأ غير معروف أثناء استدعاء الذكاء الاصطناعي';
    const status = apiError.status || '';

    if(errMsg.toLowerCase().includes('api key') || errMsg.includes('API_KEY_INVALID') || (status === 'INVALID_ARGUMENT' && errMsg.includes('API_KEY'))){
      throw new Error('مفتاح Google Gemini API غير صالح. يرجى التأكد من نسخه بشكل صحيح من Google AI Studio.');
    }
    if(status === 'RESOURCE_EXHAUSTED' || response.status === 429){
      throw new Error('تم تجاوز حد الاستخدام المسموح لنموذج Gemini مؤقتاً (Rate Limit). يرجى المحاولة بعد قليل.');
    }
    if(response.status === 503 || errMsg.includes('high demand') || errMsg.includes('overloaded')){
      throw new Error('خوادم Google تواجه ضغطاً مؤقتاً حالياً (503). يرجى المحاولة بعد قليل أو تجربة نموذج gemini-3.5-flash-lite.');
    }
    if(response.status === 404 || errMsg.includes('models/')){
      throw new Error(`النموذج (${model}) غير متاح لحسابك. يرجى اختيار gemini-3.5-flash من الإعدادات.`);
    }
    throw new Error(`خطأ Gemini (${response.status}): ${errMsg}`);
  }

  const candidate = data.candidates && data.candidates[0];
  if(!candidate || !candidate.content || !candidate.content.parts){
    if(candidate && candidate.finishReason === 'SAFETY'){
      throw new Error('تم حظر الرد من قبل معايير الأمان التابعة لـ Google.');
    }
    if(candidate && candidate.finishReason === 'MAX_TOKENS'){
      throw new Error('تم استهلاك حد الرموز (Tokens) بالكامل قبل اكتمال الرد.');
    }
    throw new Error('لم يُرجع نموذج Gemini أي محتوى في الرد.');
  }

  const parts = candidate.content.parts || [];
  let visibleText = '';
  for(const p of parts){
    if(p.text && !p.thought){
      visibleText += p.text;
    }
  }
  if(!visibleText.trim()){
    visibleText = parts.map(p => p.text || '').join('').trim();
  }

  if(!visibleText.trim()){
    if(candidate.finishReason === 'MAX_TOKENS'){
      throw new Error('تم استهلاك حد الرموز أثناء تفكير النموذج (Thinking). يرجى زيادة حد الرموز أو استخدام gemini-3.5-flash-lite.');
    }
    throw new Error('لم يُرجع نموذج Gemini أي محتوى في الرد.');
  }

  return visibleText.trim();
}

async function testGeminiConnection(apiKey, model){
  const start = Date.now();
  const testApiKey = (apiKey || getGeminiSettings().apiKey || '').trim();
  const testModel = model || getGeminiSettings().model || 'gemini-3.5-flash';

  if(!testApiKey){
    throw new Error('يرجى كتابة أو لصق مفتاح API أولاً لتجربة الاتصال.');
  }

  const prompt = 'اختبار اتصال سريع: رد بكلمة واحدة فقط: "متصل"';
  const reply = await callGeminiAI({
    apiKey: testApiKey,
    model: testModel,
    prompt: prompt,
    temperature: 0.1,
    maxTokens: 1000
  });

  const latencyMs = Date.now() - start;
  return {
    success: true,
    latencyMs: latencyMs,
    reply: reply.trim(),
    model: testModel
  };
}

async function generateSmartCostEstimateDraft(rawR, currentNotes = ''){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '';
  const dModel = (r.device && r.device.model) || '';
  const faults = Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || 'غير محدد');

  const prompt = `أنت مهندس صيانة إلكترونيات وأجهزة محترف في مركز صيانة ميكروتك (MicroTech).
المطلوب: صياغة تقرير فحص وتشخيص فني للعطل موجه للعميل مباشرة في رسالة مقايسة التكلفة بالواتساب.

بيانات الجهاز:
- نوع الجهاز: ${dCat}
- الماركة والموديل: ${dBrand} ${dModel}
- العطل والشكوى المسجلة: ${faults}
- ملاحظات الفحص الحالية للمهندس: ${currentNotes || 'لا توجد ملاحظات إضافية'}

الشروط والتعليمات:
1. اكتب التقرير بلغة عربية احترافية وواضحة ومبسطة يفهمها العميل العادي وتقنعه بسبب التكلفة وضرورة الإصلاح.
2. اجعل الصياغة في حدود 2 إلى 4 أسطر فقط.
3. وضّح الخلل الفني وما سيتم عمله في الصيانة (مثال: فحص وتغيير المكونات التالفة بدائرة الباور/الشحن، عمل شبلنة أو تغيير آي سي، فحص مسارات الفولت، عمل اختبارات الإجهاد والحرارة).
4. لا تضع أي ترحيبات أو تحيات أو توقيعات، أخرج فقط نص التقرير المباشر.`;

  try {
    const drafted = await callGeminiAI({ prompt, maxTokens: 1500, temperature: 0.4 });
    return drafted.trim().replace(/^["']|["']$/g, '');
  } catch(err) {
    console.warn('Gemini API call failed or no key set, falling back to offline expert hardware diagnosis engine:', err);
    return generateOfflineExpertCostDraft(r, currentNotes);
  }
}

function generateOfflineExpertCostDraft(r, currentNotes = '') {
  const combined = ((r.faults ? (Array.isArray(r.faults) ? r.faults.join(' ') : String(r.faults)) : '') + ' ' + (r.notes || '') + ' ' + (currentNotes || '')).toLowerCase();

  if (combined.includes('باور') || combined.includes('power') || combined.includes('شورت') || combined.includes('ماس') || combined.includes('فاصل') || combined.includes('قفل') || combined.includes('dead')) {
    return 'تم فحص الدوائر الإلكترونية الرئيسية ومسارات الجهد العالي (19V)، وتبين وجود ماس كهربائي (شورت) مع تلف في عناصر التغذية الرئيسية (موسفتات الدخل ومكثفات التنعيم). تتطلب الصيانة إزالة القصر، استبدال القطع التالفة بقطع أصلية، ومراجعة استقرار خطوط التغذية لحماية المعالج واللوحة الأم.';
  }
  if (combined.includes('مية') || combined.includes('ماء') || combined.includes('سائل') || combined.includes('عصير') || combined.includes('شاي') || combined.includes('قهوة') || combined.includes('liquid') || combined.includes('water')) {
    return 'تبين بعد الفحص الميكروسكوبي وجود آثار تسريب سوائل وأكسدة على مسارات التغذية ومكونات اللوحة الأم. تتطلب الصيانة تفكيك الجهاز بالكامل، تنظيف الأكسدة كيميائياً بالموجات فوق الصوتية، معالجة المسارات المتآكلة، واستبدال المقاومات والمكثفات المتضررة لضمان عدم حدوث قصر مستقبلي.';
  }
  if (combined.includes('شاشة') || combined.includes('screen') || combined.includes('عرض') || combined.includes('display') || combined.includes('فلاتة') || combined.includes('مكسور') || combined.includes('خطوط')) {
    return 'تم فحص دائرة العرض وإشارة الفيديو، وتبين وجود كسر/تلف في بنية الشاشة الداخلية مع حاجة لفحص فلاتة نقل الإشارة (EDP Cable) ومسارات الإضاءة الخلفية (Backlight Circuit). تشمل الصيانة تركيب شاشة بديلة أصلية مطابقة للمواصفات ومعايرة الألوان والإضاءة واختبار ثبات العرض.';
  }
  if (combined.includes('حرارة') || combined.includes('سخونة') || combined.includes('مروحة') || combined.includes('صوت عالي') || combined.includes('fan') || combined.includes('يطفي') || combined.includes('heat')) {
    return 'أظهر الفحص ارتفاعاً حرجاً في درجات حرارة المعالج والشريحة الرسومية نتيجة جفاف المعجون الحراري وانسداد مسارات التبريد وتهالك مروحة التبريد. تتطلب الصيانة صيانة نظام التبريد بالكامل، تنظيف غرف الطرد الحراري، وضع معجون حراري احترافي عالي الكفاءة، واختبار استقرار الجهاز تحت الضغط (Stress Test).';
  }
  if (combined.includes('شحن') || combined.includes('بطارية') || combined.includes('سوكت') || combined.includes('شاحن') || combined.includes('dc') || combined.includes('jack') || combined.includes('charge')) {
    return 'تم فحص دائرة الشحن ومنظومة الطاقة، وتبين وجود تلف/خلخلة في منفذ الشحن (DC Power Jack) مع عدم استقرار في إشارة الشحن الواصلة لآي سي إدارة الطاقة (Charging IC). تتطلب الصيانة صيانة وتثبيت منفذ الشحن واستبدال المكونات التالفة لضمان الشحن السليم وحماية البطارية.';
  }
  if (combined.includes('بايوس') || combined.includes('bios') || combined.includes('شاشة سوداء') || combined.includes('black screen') || combined.includes('رمشة')) {
    return 'أظهر الفحص تلفاً في البرمجة الثابتة لشريحة البايوْس (Corrupted BIOS Firmware) مما يمنع إتمام دورة الإقلاع الأولي للوحة الأم (POST). تتطلب الصيانة إعادة برمجة وشحن شريحة الـ BIOS بملف أصلي متوافق مع الموديل والسيريال وفحص مسارات الفولت المغذية للشريحة (3.3V / 1.8V).';
  }
  if (combined.includes('ssd') || combined.includes('هارد') || combined.includes('بطء') || combined.includes('ram') || combined.includes('رام')) {
    return 'تم فحص قطاعات التخزين ومنظومة الذاكرة، وتبين وجود قطاعات تالفة/بطء شديد في استجابة وحدة التخزين مما يؤثر على كفاءة واستقرار النظام. تشمل الصيانة تركيب وحدة تخزين سريعة SSD/M.2 متوافقة، نقل البيانات المهمة، وتهيئة بيئة تشغيل مستقرة وخالية من أخطاء الذاكرة.';
  }

  return 'تم إجراء الفحص الأولي للقطع الحيوية للجهاز وحصر الخلل في دوائر التشغيل والتحكم. تشمل أعمال الصيانة فحص المكونات التالفة واستبدالها ومراجعة دوائر الحماية واختبار أداء الجهاز بالكامل لضمان التشغيل المستقر والمعتمد.';
}

async function generateAiDiagnosis(rawR, additionalNotes = ''){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '';
  const dModel = (r.device && r.device.model) || '';
  const faults = Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || 'غير محدد');
  const existingNotes = r.notes || r.faultNotes || '';

  const prompt = `أنت الخبير الفني وكبير مهندسي الصيانة والإلكترونيات لمركز ميكروتك (MicroTech).
قم بإجراء تحليل تشخيصي فني دقيق لجهاز الصيانة التالي وقدم دليلاً عملياً يساعد فني الصيانة على طاولة الفحص:

بيانات الجهاز:
- نوع الجهاز: ${dCat}
- الماركة: ${dBrand}
- الموديل: ${dModel}
- الأعطال والشكوى المسجلة: ${faults}
- ملاحظات الاستلام: ${existingNotes || 'لا توجد'}
${additionalNotes ? `- ملاحظات وقياسات إضافية من الفني: ${additionalNotes}` : ''}

المطلوب تقديم تحليل فني غني ومنظم يشمل الأقسام التالية بوضوح:
### 1. الأسباب المحتملة للعطل (Root Causes)
مرتبة من الأكثر شيوعاً في هذا الموديل إلى الأقل شيوعاً.

### 2. خطوات الفحص والقياس العملي (Bench Diagnostic Steps)
خطوات محددة للقياس بالآفوميتر وملاحظة سحب الأمبير بالباور سبلاي مع الفولتيات المتوقعة (مثل: 19V, 5V, 3.3V, 1.05V, VCORE...).

### 3. القطع والمكونات المشتبه بتلفها (Suspect Components)
الدوائر المتهمة (آي سي شحن، آي سي باور، موسفتات الدخل، رامات، مكثفات تانتاليوم أو سيراميك، شورت صريح، أو عطل شحنة بايوْس BIOS).

### 4. بدائل وحلول مقترحة ونصائح وقائية
أرقام بدائل مشهورة، نصائح للحرارة واللحام، واختبار ما بعد الإصلاح.

### 5. تقرير مقترح للعميل
صياغة مبسطة ومقنعة تشرح للعميل سبب العطل وضرورة الصيانة ليتم وضعها في مقايسة التكلفة.`;

  return await callGeminiAI({ prompt, maxTokens: 2500, temperature: 0.6 });
}

function openAiDiagnosisModal(rawR){
  if(!rawR){
    showToast('لم يتم تحديد إيصال الصيانة', 'error');
    return;
  }
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const cfg = getGeminiSettings();

  const prevModal = document.getElementById('aiDiagnosisModal');
  if(prevModal) prevModal.remove();

  const rNum = String(r.receiptNumber || r.ReceiptNumber || '');
  const cName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '';
  const dModel = (r.device && r.device.model) || '';
  const faults = Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || 'غير محدد');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'aiDiagnosisModal';
  overlay.style.zIndex = '12000';

  let chatHistory = [];
  let lastDiagnosisText = '';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:760px;max-height:92vh;display:flex;flex-direction:column;padding:20px;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,0.3);">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:8px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;">${getSvgIcon("tool", 18)}</div>
          <div>
            <h3 style="margin:0;font-size:16px;color:var(--ink);display:flex;align-items:center;gap:8px;">
              المساعد الذكي لتشخيص الأعطال
              <span class="mono" style="background:rgba(124,58,237,0.1);color:#7c3aed;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;border:1px solid rgba(124,58,237,0.25);">
                ${cfg.model || 'gemini-3.5-flash'}
              </span>
            </h3>
            <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
              تحليل إلكتروني متخصص • اقتراح القياسات والبدائل • مركز صيانة ميكروتك
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="closeAiDiagModal" style="border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">&times;</button>
      </div>

      <!-- Device Summary Bar -->
      <div style="background:var(--paper2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div><b>الإيصال:</b> <span class="mono font-bold" style="color:var(--primary);direction:ltr;unicode-bidi:isolate;">#${escapeHtml(rNum)}</span> • <b>العميل:</b> ${escapeHtml(cName)}</div>
        <div><b>الجهاز:</b> <span style="font-weight:700;color:var(--ink);">${escapeHtml(dCat)} - ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</span></div>
        <div style="width:100%;background:var(--paper);padding:6px 10px;border-radius:6px;border:1px dashed var(--line);font-size:12px;margin-top:2px;">
          <b style="color:var(--amber-text);">العطل المسجل:</b> ${escapeHtml(faults)}
        </div>
      </div>

      <!-- Diagnostic Body Container (Scrollable) -->
      <div id="aiDiagBody" style="flex:1;overflow-y:auto;padding-left:6px;padding-right:6px;margin-bottom:14px;min-height:220px;">
        ${!cfg.apiKey ? `
          <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
            <div style="display:flex;justify-content:center;margin-bottom:10px;">${getSvgIcon("key", 36)}</div>
            <h4 style="margin:0 0 8px 0;font-size:16px;color:var(--ink);">مفتاح Google Gemini API غير مضبوط</h4>
            <p style="font-size:13px;color:var(--ink-secondary);max-width:460px;margin:0 auto 16px auto;line-height:1.6;">
              للاستفادة من ميزات الذكاء الاصطناعي في تشخيص الأعطال وصياغة تقارير المقايسة، يرجى إدخال مفتاح API الخاص بك. يمكنك استخراجه مجاناً في دقيقة واحدة من Google AI Studio.
            </p>
            <div style="display:flex;justify-content:center;gap:10px;">
              <button class="btn btn-primary font-bold" id="goToAiSettingsBtn">
                ${getSvgIcon("settings", 14)} الانتقال إلى إعدادات الذكاء الاصطناعي
              </button>
            </div>
          </div>
        ` : `
          <div id="aiLoadingBox" style="text-align:center;padding:40px 20px;">
            <div class="spinner" style="width:36px;height:36px;border-width:3px;border-color:rgba(124,58,237,0.2);border-top-color:#7c3aed;margin:0 auto 14px auto;"></div>
            <div style="font-weight:700;font-size:14px;color:var(--ink);">جاري تحليل العطل بواسطة Gemini AI...</div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">يتم الآن فحص الأعطال المحتملة ومسارات القياس للموديل ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</div>
          </div>
          <div id="aiResultContent" style="display:none;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px 18px;font-size:13px;line-height:1.7;"></div>
        `}
      </div>

      <!-- Quick Action Buttons -->
      <div id="aiActionButtons" style="display:none;gap:8px;flex-wrap:wrap;padding:10px 0;border-top:1px solid var(--line);margin-bottom:10px;">
        <button type="button" class="btn btn-xs" id="insertToNotesBtn" style="background:#059669;color:#fff;font-weight:700;border:none;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("fileText", 13)} إدراج في ملاحظات الإيصال
        </button>
        <button type="button" class="btn btn-xs" id="openEstFromAiBtn" style="background:#0284c7;color:#fff;font-weight:700;border:none;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("wallet", 13)} فتح مقايسة التكلفة
        </button>
        <button type="button" class="btn btn-xs btn-ghost" id="copyAiResultBtn" style="border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("copy", 13)} نسخ التحليل
        </button>
        <button type="button" class="btn btn-xs btn-ghost" id="reDiagnoseBtn" style="border-radius:6px;margin-right:auto;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("refresh", 13)} إعادة التشخيص
        </button>
      </div>

      <!-- Technician Follow-Up Chat Box -->
      <div id="aiChatBoxWrap" style="display:none;background:var(--paper2);border:1px solid var(--line);border-radius:12px;padding:10px 12px;">
        <div style="font-size:11.5px;font-weight:700;color:var(--ink-secondary);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
          <span>${getSvgIcon("message", 14)}</span> استشارة ومتابعة فنية للفني (Technician Live Bench Q&A):
        </div>
        <div id="aiChatThread" style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:8px;font-size:12px;"></div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="aiFollowUpInput" placeholder="اكتب استفساراً للفحص (مثلاً: قست خط 3.3V ولقيت شورت، أو ما هو بديل آي سي الشحن؟)..." style="flex:1;font-size:12.5px;padding:7px 10px;border-radius:8px;">
          <button type="button" class="btn btn-primary btn-sm" id="sendAiFollowUpBtn" style="background:#7c3aed;border-color:#7c3aed;padding:0 14px;font-weight:700;">
            إرسال
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeAiDiagModal').onclick = () => overlay.remove();

  const goToSettingsBtn = overlay.querySelector('#goToAiSettingsBtn');
  if(goToSettingsBtn){
    goToSettingsBtn.onclick = () => {
      overlay.remove();
      state.currentSection = 'settings';
      state.settingsTab = 'ai';
      render();
    };
    return;
  }

  const aiLoadingBox = overlay.querySelector('#aiLoadingBox');
  const aiResultContent = overlay.querySelector('#aiResultContent');
  const aiActionButtons = overlay.querySelector('#aiActionButtons');
  const aiChatBoxWrap = overlay.querySelector('#aiChatBoxWrap');
  const aiChatThread = overlay.querySelector('#aiChatThread');
  const followUpInput = overlay.querySelector('#aiFollowUpInput');
  const sendFollowUpBtn = overlay.querySelector('#sendAiFollowUpBtn');

  async function runDiagnosis(){
    if(aiLoadingBox){
      aiLoadingBox.style.display = 'block';
      aiLoadingBox.innerHTML = `
        <div class="spinner" style="width:36px;height:36px;border-width:3px;border-color:rgba(124,58,237,0.2);border-top-color:#7c3aed;margin:0 auto 14px auto;"></div>
        <div style="font-weight:700;font-size:14px;color:var(--ink);">جاري تحليل العطل بواسطة Gemini AI...</div>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">يتم الآن فحص الأعطال المحتملة ومسارات القياس للموديل ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</div>
      `;
    }
    if(aiResultContent) aiResultContent.style.display = 'none';
    if(aiActionButtons) aiActionButtons.style.display = 'none';
    if(aiChatBoxWrap) aiChatBoxWrap.style.display = 'none';

    try {
      const diagText = await generateAiDiagnosis(r);
      lastDiagnosisText = diagText;

      chatHistory = [
        { role: 'user', parts: [{ text: `قم بتحليل عطل الجهاز: ${dCat} ${dBrand} ${dModel}، العطل: ${faults}` }] },
        { role: 'model', parts: [{ text: diagText }] }
      ];

      if(aiLoadingBox) aiLoadingBox.style.display = 'none';
      if(aiResultContent){
        aiResultContent.innerHTML = renderAiMarkdownToHtml(diagText);
        aiResultContent.style.display = 'block';
      }
      if(aiActionButtons) aiActionButtons.style.display = 'flex';
      if(aiChatBoxWrap) aiChatBoxWrap.style.display = 'block';
    } catch(err){
      if(aiLoadingBox){
        aiLoadingBox.innerHTML = `
          <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:18px;text-align:center;">
            <div style="display:flex;justify-content:center;margin-bottom:8px;">${getSvgIcon("alert", 32)}</div>
            <div style="font-weight:700;color:var(--red);margin-bottom:6px;">تعذر إتمام التحليل الذكي</div>
            <div style="font-size:12.5px;color:var(--ink-secondary);line-height:1.5;">${escapeHtml(err.message || 'حدث خطأ غير متوقع')}</div>
            <button class="btn btn-ghost btn-sm" id="retryAiDiagBtn" style="margin-top:12px;color:var(--primary);">${getSvgIcon("refresh", 13)} إعادة المحاولة</button>
          </div>
        `;
        const retryBtn = overlay.querySelector('#retryAiDiagBtn');
        if(retryBtn) retryBtn.onclick = runDiagnosis;
      }
    }
  }

  const insertToNotesBtn = overlay.querySelector('#insertToNotesBtn');
  if(insertToNotesBtn){
    insertToNotesBtn.onclick = async () => {
      if(!lastDiagnosisText) return;
      const summaryLine = `[تشخيص AI - ${new Date().toLocaleDateString('ar-EG')}]: ${lastDiagnosisText.replace(/\n+/g, ' ').substring(0, 300)}...`;
      r.notes = (r.notes ? r.notes + '\n\n' : '') + summaryLine;
      const idx = (state.receipts || []).findIndex(x => String(x.id) === String(r.id));
      if(idx > -1) state.receipts[idx] = r;
      setCache('receipts', state.receipts);
      try {
        await saveReceiptRemote(r);
      } catch(e){}
      showToast('تم إدراج ملخص التشخيص في ملاحظات الإيصال بنجاح', 'success');
    };
  }

  const openEstFromAiBtn = overlay.querySelector('#openEstFromAiBtn');
  if(openEstFromAiBtn){
    openEstFromAiBtn.onclick = () => {
      overlay.remove();
      openCostEstimateModal(r);
    };
  }

  const copyAiResultBtn = overlay.querySelector('#copyAiResultBtn');
  if(copyAiResultBtn){
    copyAiResultBtn.onclick = () => {
      if(!lastDiagnosisText) return;
      navigator.clipboard.writeText(lastDiagnosisText).then(() => {
        showToast('تم نسخ التحليل بالكامل إلى الحافظة', 'success');
      }).catch(() => {
        showToast('تعذر النسخ تلقائياً', 'error');
      });
    };
  }

  const reDiagnoseBtn = overlay.querySelector('#reDiagnoseBtn');
  if(reDiagnoseBtn){
    reDiagnoseBtn.onclick = runDiagnosis;
  }

  async function handleFollowUp(){
    const q = (followUpInput.value || '').trim();
    if(!q) return;

    followUpInput.value = '';
    followUpInput.disabled = true;
    sendFollowUpBtn.disabled = true;

    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin-bottom:4px;border-right:3px solid var(--primary);align-self:flex-end;max-width:85%;';
    userBubble.innerHTML = `<b style="color:var(--primary);font-size:11px;">الفني:</b> <span>${escapeHtml(q)}</span>`;
    aiChatThread.appendChild(userBubble);

    const aiBubble = document.createElement('div');
    aiBubble.style.cssText = 'background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.25);border-radius:8px;padding:6px 10px;margin-bottom:4px;border-left:3px solid #7c3aed;max-width:92%;';
    aiBubble.innerHTML = `<b style="color:#7c3aed;font-size:11px;">المساعد الذكي:</b> <span class="mono">جاري المعالجة...</span>`;
    aiChatThread.appendChild(aiBubble);
    aiChatThread.scrollTop = aiChatThread.scrollHeight;

    chatHistory.push({ role: 'user', parts: [{ text: q }] });

    try {
      const reply = await callGeminiAI({
        contents: chatHistory,
        maxTokens: 1000,
        temperature: 0.5
      });
      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      aiBubble.innerHTML = `<b style="color:#7c3aed;font-size:11px;">المساعد الذكي:</b> <div>${renderAiMarkdownToHtml(reply)}</div>`;
    } catch(err){
      aiBubble.innerHTML = `<b style="color:var(--red);font-size:11px;">خطأ:</b> <span style="color:var(--red);">${escapeHtml(err.message || 'تعذر الحصول على إجابة')}</span>`;
    } finally {
      followUpInput.disabled = false;
      sendFollowUpBtn.disabled = false;
      followUpInput.focus();
      aiChatThread.scrollTop = aiChatThread.scrollHeight;
    }
  }

  if(sendFollowUpBtn && followUpInput){
    sendFollowUpBtn.onclick = handleFollowUp;
    followUpInput.onkeydown = (e) => {
      if(e.key === 'Enter'){
        e.preventDefault();
        handleFollowUp();
      }
    };
  }

  runDiagnosis();
}

window.openAiDiagnosisModalDirect = function(safeId, rNum){
  const r = findReceiptByIdOrNum(safeId, rNum);
  if(r) openAiDiagnosisModal(r);
  else showToast('لم يتم العثور على الإيصال المطلوب', 'error');
};
