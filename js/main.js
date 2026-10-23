(function(){
  "use strict";
	
	const form = document.getElementById("form"), 
		  blankBox = document.getElementById("blank-box"),
		  phone = document.getElementById("phone");
	
	
  phone.addEventListener("input", () => {
	  
    let d = phone.value.replace(/\D/g, "");
	  
	if(d && d.charAt(0) == "8") d = "7" + d;
	else if(d && d.charAt(0) != "7") d = "7" + d;
	  
    d = d.slice(0, 11);
    let telString = "";
	  
    if(d.length){
		telString = "+7";
      if(d.length > 1) telString += " (" + d.slice(1, 4);
      if(d.length >= 4) telString += ") " + d.slice(4, 7);
      if(d.length >= 7) telString += "-" + d.slice(7, 9);
      if(d.length >= 9) telString += "-" + d.slice(9, 11);
    }
    phone.value = telString;
  });
	
	
	
  /*
   *	Проверка данных формы
   */
	
  const fields = {
    fio:   {
		input: document.getElementById("fio"),
		err: document.getElementById("fioErr"),
		fld: document.getElementById("fldFio")
	},
    phone: {
		input: phone,
		err: document.getElementById("phoneErr"),
		fld: document.getElementById("fldPhone")
	},
    email: {
		input: document.getElementById("email"),
		err: document.getElementById("emailErr"),
		fld: document.getElementById("fldEmail")
	}
  };

  function showError(name, msg){
    fields[name].fld.classList.add("invalid");
    fields[name].err.textContent = msg;
    fields[name].input.setAttribute("aria-invalid", "true");
  }
  function clearError(name){
    fields[name].fld.classList.remove("invalid");
    fields[name].err.textContent = "";
    fields[name].input.removeAttribute("aria-invalid");
  }

  const validators = {
    fio: (v) => {
      let val = v.trim();
      if (!val) return "Укажите фамилию, имя и отчество";
      if (!/^[А-ЯЁа-яёA-Za-z][А-ЯЁа-яёA-Za-z\- ]*$/.test(val)) return "Допустимы только буквы, пробелы и дефисы";
      if (val.split(/\s+/).length < 2) return "Укажите как минимум фамилию и имя";
      return false;
    },
    phone: () => {
      let d = phone.value.replace(/\D/g, "");
      if (!d) return "Укажите номер телефона";
      if (d.length !== 11) return "Введите номер полностью";
      return false;
    },
    email: (v) => {
      let val = v.trim();
      if (!val) return "Укажите адрес эл. почты";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return "Проверьте формат почты";
      return false;
    }
  };

  Object.keys(fields).forEach(name => {
    fields[name].input.addEventListener("blur", () => {
      let msg = validators[name](fields[name].input.value);
      msg ? showError(name, msg) : clearError(name);
    });
  });

  /*
   *	поле canvas для подписи
   */
  const canvas = document.getElementById("signature"),
		wrap = document.getElementById("sigWrap"),
        hint = document.getElementById("sigHint"),
		status = document.getElementById("sigStatus"),
		statusText = document.getElementById("sigStatusText"),
  		ctx = canvas.getContext("2d"),
		lcolor = "#000000";
	
  let strokes = [],
  		current = null,
	  	drawing = false,
	  	rect = null,
  		lineWidth = 2;

  function syncSize(){
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width  = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function redraw(){
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = lcolor;
	ctx.lineCap = ctx.lineJoin = "round";
	  
    for (const s of strokes) drawStroke(s, w, h);
  }

  
  function drawStroke(s, w, h){
    const pts = s.pts, n = pts.length;
    if (!n) return;
    ctx.lineWidth = s.size;
    const P = i => ({ x: pts[i].x * w, y: pts[i].y * h });
    if (n === 1){
      const p = P(0);
      ctx.beginPath(); ctx.arc(p.x, p.y, s.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = lcolor; ctx.fill();
      return;
    }
    ctx.beginPath(); ctx.moveTo(P(0).x, P(0).y);
    if (n === 2){ ctx.lineTo(P(1).x, P(1).y); }
    else {
      for (let i = 1; i < n - 1; i++){
        const m = { x:(P(i).x + P(i+1).x)/2, y:(P(i).y + P(i+1).y)/2 };
        ctx.quadraticCurveTo(P(i).x, P(i).y, m.x, m.y);
      }
      ctx.lineTo(P(n-1).x, P(n-1).y);
    }
    ctx.stroke();
  }

  
  function drawSegment(s){
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const pts = s.pts, n = pts.length;
    if (n < 2) return;
    ctx.strokeStyle = lcolor; ctx.lineWidth = s.size;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const P = i => ({ x: pts[i].x * w, y: pts[i].y * h });
    const a = P(n-2), b = P(n-1);
    ctx.beginPath();
    if (n === 2){ ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    else {
      const m = P(n-3);
      ctx.moveTo((m.x + a.x)/2, (m.y + a.y)/2);
      ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x)/2, (a.y + b.y)/2);
    }
    ctx.stroke();
  }

  function norm(e){
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    };
  }

  function markSigned(){
    wrap.classList.add("signed");
    wrap.classList.remove("invalid");
    status.classList.add("done");
    statusText.textContent = "Подпись поставлена";
  }

  canvas.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    rect = canvas.getBoundingClientRect();
    drawing = true;
    current = { size: lineWidth, pts: [norm(e)] };
    strokes.push(current);
    drawStroke(current, rect.width, rect.height);
    markSigned();
  });

  canvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events){
      const p = norm(ev);
      const last = current.pts[current.pts.length - 1];
      if (Math.hypot((p.x - last.x) * rect.width, (p.y - last.y) * rect.height) < 1) continue;
      current.pts.push(p);
      drawSegment(current);
    }
  });

  function finishStroke(){
    if (!drawing) return;
    drawing = false;
    const n = current.pts.length;
    if (n >= 3){
      const w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
      const a = { x: current.pts[n-2].x * w, y: current.pts[n-2].y * h };
      const b = { x: current.pts[n-1].x * w, y: current.pts[n-1].y * h };
      ctx.beginPath();
      ctx.moveTo((a.x + b.x)/2, (a.y + b.y)/2);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    current = null;
  }
  canvas.addEventListener("pointerup", finishStroke);
  canvas.addEventListener("pointercancel", finishStroke);

  
  new ResizeObserver(syncSize).observe(wrap);
  syncSize();


  document.getElementById("clearBtn").addEventListener("click", () => {
    strokes = [];
    redraw();
    wrap.classList.remove("signed");
    status.classList.remove("done");
    statusText.textContent = "Подпись не поставлена";
  });

  function sendError(msg){
    const fld = document.getElementById("fldSig");
    fld.classList.add("invalid");
    document.getElementById("sigErr").textContent = msg;
    wrap.classList.add("invalid", "shake");
    wrap.addEventListener("animationend", () => wrap.classList.remove("shake"), { once:true });
  }

	
  /*
   *	Отправляем данные на сервер
   */
  const submitBtn = document.getElementById("submitBtn"),
		formStatus = document.getElementById("formStatus");
  let sigImg = "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formStatus.classList.remove("show");

    let ok = true, firstInvalid = null;
	  
    for (const name of Object.keys(fields)){
      const msg = validators[name](fields[name].input.value);
      if (msg){
		  showError(name, msg);
			ok = false;
			firstInvalid = firstInvalid || fields[name].input;
	  }
      else clearError(name);
    }
	  
    if (!strokes.length){
      sendError("Поставьте подпись в отведённом поле");
      ok = false;
    }
	  
    if (!ok){ 
		firstInvalid && firstInvalid.focus();
		return;
	}

    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitBtn.setAttribute("aria-busy", "true");

    try{
      sigImg = canvas.toDataURL("image/png");

      const fd = new FormData();
      fd.append("fio",   document.getElementById("fio").value.trim());
      fd.append("phone", phone.value);
      fd.append("email", document.getElementById("email").value.trim());
      fd.append("signature", sigImg);

      const connect = fetch("signature.php",
	  {
		  method: "POST",
		  body: fd
	  });
		
		const respData = connect.text();
		
		formStatus.textContent = respData;
		formStatus.classList.add("show");
		
    } catch(e) {
		
      formStatus.textContent = "Не удалось отправить данные на сервер";
      formStatus.classList.add("show");
		
    } finally {
		
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.removeAttribute("aria-busy");
    }
  });

})();
