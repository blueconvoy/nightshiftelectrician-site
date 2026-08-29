(function () {
	var toggleBtn = document.querySelector('.mobile-menu-btn');
	var navLinks = document.querySelector('.nav-links');
	var navCta = document.querySelector('.nav-cta');

	if (toggleBtn) {
		toggleBtn.addEventListener('click', function () {
			navLinks.classList.toggle('active');
			navCta.classList.toggle('active');
		});
	}

	document.querySelectorAll('.nav-links a').forEach(function (link) {
		link.addEventListener('click', function () {
			navLinks.classList.remove('active');
			navCta.classList.remove('active');
		});
	});
})();
