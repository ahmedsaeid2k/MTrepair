/* ---------------- Journal Entries View (دفتر القيود اليومية) ---------------- */
function renderJournalEntries(main){
  const entries = [...state.journalEntries].reverse();

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("fileText", 22)} دفتر القيود اليومية (General Journal)</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${entries.length} قيد مسجل</div>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" id="newManualJournalBtn">${getSvgIcon("plus", 14)} إضافة قيد يدوي جديد</button>
      </div>
    </div>

    ${entries.length===0 ? '<div class="empty">لا توجد قيود مسجلة بعد. سيتم تسجيل القيود آلياً عند إجراء المعاملات أو إضافة قيد يدوي.</div>' : `
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${entries.map(je=>`
        <div class="card" style="padding:14px 16px;margin-bottom:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:8px;">
            <div>
              <span class="mono font-bold" style="color:var(--primary);font-size:13.5px;">${je.EntryNumber||je.ID}</span>
              <span style="color:var(--ink-secondary);font-size:12px;margin-right:8px;">${getSvgIcon("calendar", 12)} ${cleanDate(je.Date)}</span>
              <span class="status-badge st-check" style="font-size:10.5px;margin-right:6px;">${je.ReferenceType||'Manual'}</span>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);">بواسطة: <b>${je.By||'نظام'}</b></div>
          </div>
          <div style="font-weight:700;font-size:13px;margin-bottom:8px;">${je.Description}</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>كود الحساب</th><th>اسم الحساب</th><th>البيان / ملاحظة</th><th>مدين (Debit)</th><th>دائن (Credit)</th></tr></thead>
              <tbody>
                ${(je.Lines||[]).map(l=>`<tr>
                  <td class="mono font-bold">${l.AccountCode}</td>
                  <td><b>${l.AccountName||(state.accounts.find(a=>a.Code===l.AccountCode)||{}).Name||'-'}</b></td>
                  <td style="color:var(--ink-secondary);font-size:11.5px;">${l.Notes||'-'}</td>
                  <td class="mono ${Number(l.Debit)>0?'font-bold':''}" style="color:${Number(l.Debit)>0?'var(--blue)':'inherit'};">${Number(l.Debit)>0?Number(l.Debit).toLocaleString()+' ج.م':'-'}</td>
                  <td class="mono ${Number(l.Credit)>0?'font-bold':''}" style="color:${Number(l.Credit)>0?'var(--green)':'inherit'};">${Number(l.Credit)>0?Number(l.Credit).toLocaleString()+' ج.م':'-'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('')}
    </div>`}
  `;

  document.getElementById('newManualJournalBtn').onclick = ()=>openManualJournalModal();
}

function openManualJournalModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  let lines = [
    {accountCode:'', debit:0, credit:0, notes:''},
    {accountCode:'', debit:0, credit:0, notes:''}
  ];

  function renderModalContent(){
    const totalDebit = lines.reduce((s,l)=>s+Number(l.debit||0),0);
    const totalCredit = lines.reduce((s,l)=>s+Number(l.credit||0),0);
    const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:760px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
          <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">${getSvgIcon("plus", 16)} إضافة قيد يومية يدوي متوازن</h3>
          <button class="btn btn-ghost btn-xs" id="closeJournalModal" aria-label="إغلاق">&times;</button>
        </div>

        <div class="grid2">
          <div class="field"><label>التاريخ *</label><input id="jeDate" type="date" value="${(typeof localDateStr === 'function') ? localDateStr() : new Date().toISOString().slice(0,10)}"></div>
          <div class="field"><label>البيان العام للقيد *</label><input id="jeDesc" placeholder="مثال: تسوية جردية، سداد مصروفات نقدية..."></div>
        </div>

        <label style="margin:10px 0 6px;">بنود القيد (الطرف المدين والطرف الدائن):</label>
        <div id="journalLinesMount">
          ${lines.map((l,i)=>`
            <div class="journal-line-row">
              <select data-jacc="${i}">
                <option value="">-- اختر الحساب الفرعي التشغيلي --</option>
                ${state.accounts.map(a=>{
                  const isParent = (state.accounts||[]).some(x => String(x.ParentCode) === String(a.Code));
                  return `<option value="${a.Code}" ${l.accountCode===a.Code?'selected':''} ${isParent?'disabled style="color:#94a3b8;background:#f8fafc;"':''}>${a.Code} - ${a.Name} ${isParent ? '(رئيسي تجميعي - لا يقبل القيود)' : ''}</option>`;
                }).join('')}
              </select>
              <input type="number" placeholder="مدين" value="${l.debit||''}" data-jdebit="${i}">
              <input type="number" placeholder="دائن" value="${l.credit||''}" data-jcredit="${i}">
              <input placeholder="بيان السطر..." value="${l.notes||''}" data-jnotes="${i}">
              <button class="btn btn-xs btn-red" data-jdel="${i}" style="height:34px;">&times;</button>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-ghost btn-xs" id="addJournalLineBtn" style="margin-top:6px;">${getSvgIcon("plus", 13)} إضافة سطر جديد</button>

        <div class="fin-box" style="margin:16px 0;">
          <div class="fin-cell"><div class="l">إجمالي المدين</div><div class="v mono">${totalDebit} ج.م</div></div>
          <div class="fin-cell"><div class="l">إجمالي الدائن</div><div class="v mono">${totalCredit} ج.م</div></div>
          <div class="fin-cell"><div class="l">حالة التوازن</div><div class="v" style="color:${isBalanced?'var(--green)':'var(--red)'};font-size:12px;">${isBalanced?'متوازن ومطابق':'غير متوازن'}</div></div>
        </div>

        <div class="actions-row">
          <button class="btn btn-ghost" id="cancelJournalModal">إلغاء</button>
          <button class="btn btn-primary" id="saveJournalModalBtn" ${!isBalanced?'disabled':''}>${getSvgIcon("check", 14)} ترحيل وحفظ القيد</button>
        </div>
      </div>
    `;

    overlay.querySelector('#closeJournalModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelJournalModal').onclick = ()=>overlay.remove();

    overlay.querySelector('#addJournalLineBtn').onclick = ()=>{
      lines.push({accountCode:'', debit:0, credit:0, notes:''});
      renderModalContent();
    };

    overlay.querySelectorAll('[data-jacc]').forEach(sel=>{
      sel.onchange = (e)=>{ lines[Number(sel.dataset.jacc)].accountCode = e.target.value; };
    });
    overlay.querySelectorAll('[data-jdebit]').forEach(inp=>{
      inp.oninput = (e)=>{
        lines[Number(inp.dataset.jdebit)].debit = Number(e.target.value)||0;
        if(Number(e.target.value)>0) lines[Number(inp.dataset.jdebit)].credit = 0;
      };
      inp.onblur = ()=>renderModalContent();
    });
    overlay.querySelectorAll('[data-jcredit]').forEach(inp=>{
      inp.oninput = (e)=>{
        lines[Number(inp.dataset.jcredit)].credit = Number(e.target.value)||0;
        if(Number(e.target.value)>0) lines[Number(inp.dataset.jcredit)].debit = 0;
      };
      inp.onblur = ()=>renderModalContent();
    });
    overlay.querySelectorAll('[data-jnotes]').forEach(inp=>{
      inp.oninput = (e)=>{ lines[Number(inp.dataset.jnotes)].notes = e.target.value; };
    });
    overlay.querySelectorAll('[data-jdel]').forEach(btn=>{
      btn.onclick = ()=>{
        if(lines.length<=2){ showToast('يجب أن يحتوي القيد على سطرين على الأقل', 'error'); return; }
        lines.splice(Number(btn.dataset.jdel), 1);
        renderModalContent();
      };
    });

    const saveBtn = overlay.querySelector('#saveJournalModalBtn');
    if(saveBtn) saveBtn.onclick = async ()=>{
      const desc = overlay.querySelector('#jeDesc').value.trim();
      const date = overlay.querySelector('#jeDate').value;
      if(!desc){ showToast('اكتب بيان القيد', 'error'); return; }
      if(!isBalanced){ showToast('القيد غير متوازن: المدين لا يساوي الدائن', 'error'); return; }

      for(const l of lines){
        if(!l.accountCode){ showToast('يجب اختيار الحساب لجميع أسطر القيد', 'error'); return; }
        const isParent = (state.accounts || []).some(a => String(a.ParentCode) === String(l.accountCode));
        if(isParent){
          showToast(`الحساب (${l.accountCode}) هو حساب رئيسي/تجميعي ولا يقبل القيود المباشرة؛ اختر حساباً فرعياً تشغيلياً`, 'error');
          return;
        }
      }
      
      const formattedLines = lines.map(l=>{
        const a = state.accounts.find(x=>x.Code===l.accountCode);
        return {
          AccountCode: l.accountCode,
          AccountName: a ? a.Name : '',
          Debit: Number(l.debit||0),
          Credit: Number(l.credit||0),
          Notes: l.notes || ''
        };
      });

      try{
        await saveJournalEntryRemote({
          Date: date,
          Description: desc,
          ReferenceType: 'Manual',
          Lines: formattedLines,
          TotalDebit: totalDebit,
          TotalCredit: totalCredit
        });
        overlay.remove();
        showToast('تم ترحيل وحفظ القيد اليومي بنجاح', 'success');
        renderJournalEntries(document.getElementById('main'));
      }catch(e){ showToast('حدث خطأ أثناء حفظ القيد: ' + (e.message || e), 'error'); }
    };
  }

  document.body.appendChild(overlay);
  renderModalContent();
}
