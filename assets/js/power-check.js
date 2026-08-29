(function () {
	var body = document.getElementById('pcwBody');
	var progressEl = document.getElementById('pcwProgress');
	if (!body || !progressEl) return;

	var PHONE_DISPLAY = '+65 8159 0208';
	var PHONE_TEL = 'tel:+6581590208';
	var WA_NUMBER = '6581590208';
	var FEE = 'S$185';
	var SP_GROUP_TEL = 'tel:+18007788888';

	var history = [];

	function waLink(text) {
		return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
	}

	function renderProgress(step) {
		var total = 3;
		var pos = { start: 0, q2: 1, q3: 1, qualify: 2, result: 3 }[step];
		if (pos === undefined) pos = 0;
		progressEl.innerHTML = '';
		for (var i = 0; i < total; i++) {
			var seg = document.createElement('div');
			seg.className = 'seg' + (i < pos ? ' done' : (i === pos ? ' active' : ''));
			seg.innerHTML = '<i></i>';
			progressEl.appendChild(seg);
		}
	}

	function go(step, ctx) {
		history.push({ step: step, ctx: ctx || {} });
		render(step, ctx || {});
	}

	function back() {
		history.pop();
		var prev = history.pop();
		if (!prev) prev = { step: 'start', ctx: {} };
		render(prev.step, prev.ctx);
	}

	function optionsHTML(list) {
		return list.map(function (o, i) {
			return '<button class="pcw-opt' + (o.danger ? ' danger-opt' : '') + '" data-i="' + i + '">' +
				'<span class="ic">' + o.icon + '</span><span>' + o.label + '</span></button>';
		}).join('');
	}

	function bindOptions(list) {
		var btns = body.querySelectorAll('.pcw-opt');
		btns.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var idx = parseInt(btn.getAttribute('data-i'), 10);
				list[idx].action();
			});
		});
	}

	function screen(html, backable) {
		body.innerHTML = html;
		if (backable !== false && history.length > 1) {
			var b = document.createElement('button');
			b.className = 'pcw-back';
			b.textContent = '← Back';
			b.addEventListener('click', back);
			body.appendChild(b);
		}
	}

	// ---------- STEP: start ----------
	function stepStart() {
		renderProgress('start');
		var opts = [
			{ icon: '🔥', label: 'Sparks, smoke, or a burning smell', danger: true, action: function () { go('result', { kind: 'safety' }); } },
			{ icon: '🏘️', label: 'Whole home dark — neighbours too', action: function () { go('result', { kind: 'estate' }); } },
			{ icon: '🏠', label: 'Whole home dark, neighbours seem fine', action: function () { go('q2', { kind: 'wholeUnit' }); } },
			{ icon: '🛗', label: 'Common area out (corridor, lift, riser)', action: function () { go('result', { kind: 'mcst' }); } },
			{ icon: '🔌', label: 'Just one appliance or socket', action: function () { go('q2', { kind: 'appliance' }); } },
			{ icon: '⚡', label: "A breaker keeps tripping / won't reset", action: function () { go('qualify', { kind: 'standard' }); } }
		];
		screen(
			'<span class="pcw-eyebrow">Step 1 of 3</span>' +
			'<div class="pcw-q">What\'s happening right now?</div>' +
			'<div class="pcw-sub">Pick the one that\'s closest — we\'ll ask one or two follow-ups.</div>' +
			'<div class="pcw-options">' + optionsHTML(opts) + '</div>',
			false
		);
		bindOptions(opts);
	}

	// ---------- STEP: q2 (branches) ----------
	function stepQ2(ctx) {
		renderProgress('q2');
		if (ctx.kind === 'wholeUnit') {
			var opts = [
				{ icon: '✅', label: 'All switches are up / on', action: function () { go('qualify', { kind: 'externalSupply' }); } },
				{ icon: '⬇️', label: 'One or more are flipped down', action: function () { go('qualify', { kind: 'standard' }); } },
				{ icon: '🤷', label: "Not sure / can't check safely", action: function () { go('qualify', { kind: 'standard' }); } }
			];
			screen(
				'<span class="pcw-eyebrow">Step 2 of 3</span>' +
				'<div class="pcw-q">Take a look at your DB box (the switch panel).</div>' +
				'<div class="pcw-sub">Are all the breaker switches up, or is one tripped?</div>' +
				'<div class="pcw-options">' + optionsHTML(opts) + '</div>'
			);
			bindOptions(opts);
			return;
		}
		if (ctx.kind === 'appliance') {
			var opts2 = [
				{ icon: '🔁', label: "Yes — still doesn't work there either", action: function () { go('qualify', { kind: 'applianceFault' }); } },
				{ icon: '✨', label: 'Yes — it works fine in the other spot', action: function () { go('qualify', { kind: 'applianceFault' }); } },
				{ icon: '⚠️', label: 'Yes — the new socket trips too', action: function () { go('qualify', { kind: 'standard' }); } },
				{ icon: '❌', label: "Haven't tried that yet", action: function () { go('q3', { kind: 'applianceTry' }); } }
			];
			screen(
				'<span class="pcw-eyebrow">Step 2 of 3</span>' +
				'<div class="pcw-q">Have you tried it in a different power point?</div>' +
				'<div class="pcw-sub">This tells us if it\'s the appliance or the wiring.</div>' +
				'<div class="pcw-options">' + optionsHTML(opts2) + '</div>'
			);
			bindOptions(opts2);
			return;
		}
	}

	// ---------- STEP: q3 ----------
	function stepQ3(ctx) {
		renderProgress('q3');
		if (ctx.kind === 'applianceTry') {
			screen(
				'<span class="pcw-eyebrow">Quick test</span>' +
				'<div class="pcw-q">Go ahead and try a different socket now.</div>' +
				'<div class="pcw-sub">We\'ll wait. Tap what happened.</div>' +
				'<div class="pcw-options" id="pcwQ3opts"></div>'
			);
			var opts = [
				{ icon: '✨', label: 'Works fine in the other socket', action: function () { go('qualify', { kind: 'applianceFault' }); } },
				{ icon: '🔁', label: "Still doesn't work there either", action: function () { go('qualify', { kind: 'applianceFault' }); } },
				{ icon: '⚠️', label: 'The new socket trips too', action: function () { go('qualify', { kind: 'standard' }); } }
			];
			document.getElementById('pcwQ3opts').innerHTML = optionsHTML(opts);
			bindOptions(opts);
		}
	}

	// ---------- STEP: qualify (property info before result) ----------
	function stepQualify(ctx) {
		renderProgress('qualify');
		screen(
			'<span class="pcw-eyebrow">Last step</span>' +
			'<div class="pcw-q">A couple of details, then we\'ll route you.</div>' +
			'<div class="pcw-sub">Helps the electrician come prepared.</div>' +
			'<div class="pcw-field">' +
			'<label>Property type</label>' +
			'<select id="pcwProp">' +
			'<option value="HDB flat">HDB flat</option>' +
			'<option value="EC / Condo">EC / Condo</option>' +
			'<option value="Landed house">Landed house</option>' +
			'<option value="Commercial unit">Commercial unit</option>' +
			'</select>' +
			'</div>' +
			'<div class="pcw-field">' +
			'<label>Postal code (optional)</label>' +
			'<input type="text" id="pcwPostal" placeholder="e.g. 560123" inputmode="numeric" maxlength="6">' +
			'</div>' +
			'<button class="pcw-submit" id="pcwQualifySubmit">See what to do next →</button>'
		);
		document.getElementById('pcwQualifySubmit').addEventListener('click', function () {
			var property = document.getElementById('pcwProp').value;
			var postal = document.getElementById('pcwPostal').value.trim();
			go('result', { kind: ctx.kind, property: property, postal: postal });
		});
	}

	// ---------- RESULT screens ----------
	var RESULTS = {
		safety: function () {
			return {
				badgeClass: 'danger',
				badgeText: '⛔ Safety emergency',
				title: "Stop — don't touch anything near it.",
				body: 'If you can safely reach it, switch off the main breaker at your DB box.',
				primary: { label: '📞 Call now — ' + PHONE_DISPLAY, href: PHONE_TEL },
				secondary: { label: 'Message on WhatsApp instead', href: waLink('URGENT — sparks/smoke/burning smell, need an electrician now.') }
			};
		},
		estate: function () {
			return {
				badgeClass: 'safe',
				badgeText: '✅ No dispatch needed',
				title: 'Sounds like an estate-wide outage.',
				body: "This is on SP Group's side, not your home wiring.",
				fee: 'No charge — nothing on your end to fix.',
				primary: { label: '📞 Call SP Group — 1800 778 8888', href: SP_GROUP_TEL },
				secondary: { label: 'Still want us to double-check your unit?', href: '#', onClick: function () { go('q2', { kind: 'wholeUnit' }); } }
			};
		},
		mcst: function () {
			return {
				badgeClass: 'safe',
				badgeText: "✅ Not your unit's wiring",
				title: 'That\'s common property — Town Council / MCST territory.',
				body: 'Corridors, lifts, and risers are maintained by your Town Council or MCST, not your household.',
				fee: "No charge — we're just not the right ones to call for common property.",
				primary: { label: 'Message us if you want help finding the right contact', href: waLink('Hi — common area (corridor/lift/riser) has a power issue. Can you point me to who to call?') },
				secondary: { label: 'Actually, my own unit is affected too', href: '#', onClick: function () { history = []; go('start', {}); } }
			};
		},
		externalSupply: function (ctx) {
			var msg = 'Hi — whole unit is without power, neighbours seem fine, all my DB switches are up. ';
			if (ctx.property) msg += 'Property: ' + ctx.property + '. ';
			if (ctx.postal) msg += 'Postal code: ' + ctx.postal + '. ';
			return {
				badgeClass: 'safe',
				badgeText: '💡 Try this first',
				title: 'Check your SP meter compartment first.',
				body: "If all your DB breakers are up but you're still dark, it's sometimes a tripped main switch or blown fuse outside your unit — worth a look before booking a visit.",
				fee: 'Free advice. Still dark after checking? ' + FEE + ' call-out fee covers the full diagnosis and fix where safe.',
				primary: { label: 'Still dark? Message us on WhatsApp', href: waLink(msg + 'Checked the meter compartment, still no power.') },
				secondary: { label: 'Call instead — ' + PHONE_DISPLAY, href: PHONE_TEL }
			};
		},
		applianceFault: function (ctx) {
			var msg = 'Hi — think it might be an appliance fault, not the wiring. Tested it in a different socket. ';
			if (ctx.property) msg += 'Property: ' + ctx.property + '. ';
			if (ctx.postal) msg += 'Postal code: ' + ctx.postal + '. ';
			return {
				badgeClass: 'safe',
				badgeText: '💡 Likely appliance fault',
				title: 'Sounds like the appliance, not your wiring.',
				body: "Since it's still faulty in a different socket, this points to the appliance, not the wiring — worth checking the appliance or its plug/fuse first.",
				fee: 'No charge for this advice. Want a second opinion on-site anyway? Usual ' + FEE + ' call-out fee applies.',
				primary: { label: 'Want us to confirm anyway? Message us', href: waLink(msg) },
				secondary: { label: 'Call instead — ' + PHONE_DISPLAY, href: PHONE_TEL }
			};
		},
		standard: function (ctx) {
			var msg = 'Hi — need an electrician. ';
			if (ctx.property) msg += 'Property: ' + ctx.property + '. ';
			if (ctx.postal) msg += 'Postal code: ' + ctx.postal + '. ';
			msg += "Symptom: breaker tripped / won't reset or a circuit fault.";
			return {
				badgeClass: 'default',
				badgeText: '🔧 Worth a proper look',
				title: 'This is worth a proper look.',
				body: 'A tripping or unresponsive breaker usually means a real fault on that circuit. A licensed electrician can diagnose it and, where it\'s safe, fix it the same visit.',
				fee: FEE + ' call-out fee covers the visit, full diagnosis, and the fix if it\'s a straightforward isolation. Bigger job? You\'ll get a clear quote before it starts.',
				primary: { label: '💬 Message us on WhatsApp', href: waLink(msg) },
				secondary: { label: 'Call instead — ' + PHONE_DISPLAY, href: PHONE_TEL }
			};
		}
	};

	function stepResult(ctx) {
		renderProgress('result');
		var r = RESULTS[ctx.kind](ctx);
		var badgeCls = r.badgeClass === 'default' ? '' : (' ' + r.badgeClass);
		var commercialNote = '';
		if (ctx.property === 'Commercial unit') {
			commercialNote = '<div class="pcw-commercial-note">One note for commercial units: we\'ll confirm the job\'s scope matches what we\'re licensed to handle before work starts — most shops and small commercial units are straightforward.</div>';
		}
		var html =
			'<span class="pcw-badge' + badgeCls + '"><span class="dot"></span>' + r.badgeText + '</span>' +
			'<div class="pcw-result-title">' + r.title + '</div>' +
			'<div class="pcw-result-body">' + r.body + '</div>' +
			(r.fee ? '<div class="pcw-fee-note">' + r.fee + '</div>' : '') +
			'<div class="pcw-ctas">' +
			'<a class="pcw-cta-primary' + (r.primary.danger ? ' danger' : '') + '" href="' + r.primary.href + '" target="_blank" rel="noopener" id="pcwPrimaryBtn">' + r.primary.label + '</a>' +
			(r.secondary ? '<a class="pcw-cta-secondary" href="' + r.secondary.href + '" ' + (r.secondary.onClick ? '' : 'target="_blank" rel="noopener"') + ' id="pcwSecondaryBtn">' + r.secondary.label + '</a>' : '') +
			'</div>' +
			commercialNote;
		screen(html);
		if (r.secondary && r.secondary.onClick) {
			document.getElementById('pcwSecondaryBtn').addEventListener('click', function (e) {
				e.preventDefault();
				r.secondary.onClick();
			});
		}
	}

	function render(step, ctx) {
		ctx = ctx || {};
		if (step === 'start') stepStart();
		else if (step === 'q2') stepQ2(ctx);
		else if (step === 'q3') stepQ3(ctx);
		else if (step === 'qualify') stepQualify(ctx);
		else if (step === 'result') stepResult(ctx);
	}

	var restartBtn = document.getElementById('pcwRestart');
	if (restartBtn) {
		restartBtn.addEventListener('click', function () {
			history = [];
			go('start', {});
		});
	}

	go('start', {});
})();
