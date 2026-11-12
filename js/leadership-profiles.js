(function () {
  'use strict';

  const modal = document.getElementById('wfcProfileModal');
  if (!modal) return;

  const backdrop = modal.querySelector('.wfc-profile-modal__backdrop');
  const closeBtn = modal.querySelector('.wfc-profile-modal__close');
  const labelEl = document.getElementById('wfcModalLabel');
  const nameEl = document.getElementById('wfcModalName');
  const designationEl = document.getElementById('wfcModalDesignation');
  const bioEl = document.getElementById('wfcModalBio');
  const photoEl = document.getElementById('wfcModalPhoto');
  const linkedinEl = document.getElementById('wfcModalLinkedIn');

  const profiles = {
    navneet: {
      label: 'FOUNDING LEADERSHIP',
      name: 'Navneet Momi',
      designation: 'Founder & Strategic Advisor – Legal, Governance & Strategy',
      image: 'Assets/navneet.jpg',
      imageAlt: 'Navneet Momi',
      summary:
        'Over 17 years in legal and strategic advisory across corporate law, governance, transactions and startup advisory.',
      linkedin: 'https://www.linkedin.com/in/navneet-momi-39373511/',
      bio: [
        'With over 17 years of legal and strategic advisory experience, Navneet brings expertise across corporate law, governance, transactions and startup advisory.',
        'As Founder and Managing Partner of Intellect Juris Law Offices, she has advised businesses and entrepreneurs across complex legal, regulatory and strategic matters. At WeFundCo, she leads the platform’s legal, governance and strategic architecture.',
        'Her vision is to make legal preparedness and sound governance integral to the funding journey, helping founders build credible businesses and investors make better-informed decisions.'
      ]
    },
    sunil: {
      label: 'ADVISORY BOARD',
      name: 'Sunil Saklani',
      designation: 'Advisor — Founder, S R Saklani & Co.; Former Director, Deloitte Haskins & Sells LLP',
      image: 'Assets/sunil.png',
      imageAlt: 'Sunil Saklani',
      summary:
        'Cost and Management Accountant with 20 years across indirect taxation, regulatory compliance and corporate advisory.',
      linkedin: '',
      bio: [
        'Sunil is a Cost and Management Accountant with 20 years of experience across indirect taxation, regulatory compliance and corporate advisory. He is the Founder of S R Saklani & Co. and a former Director at Deloitte Haskins & Sells LLP.',
        'His expertise covers GST, customs, trade agreements and government incentives, alongside tax systems implementation and compliance management.',
        'At WeFundCo, his advisory focus is to strengthen the platform’s perspective on tax preparedness, regulatory compliance and business assessment.'
      ]
    }
  };

  const photoFallback = document.getElementById('wfcModalPhotoFallback');

  function resolveSrc(raw) {
    if (!raw) return '';
    try {
      return new URL(raw, window.location.href).href;
    } catch {
      return raw;
    }
  }

  function cardThumbnail(id) {
    const card = document.querySelector(`.wfc-profile-card[data-wfc-profile="${id}"]`);
    if (!card) return null;
    const img = card.querySelector('.wfc-profile-photo');
    const raw = img?.getAttribute('src') || '';
    if (!img || !raw) return null;
    return {
      src: resolveSrc(raw),
      alt: img.getAttribute('alt') || '',
    };
  }

  function setPhoto(profile, id) {
    if (!photoEl || !photoFallback) return;
    const thumb = cardThumbnail(id);
    const src = thumb?.src || resolveSrc(profile.image || '');
    const alt = thumb?.alt || profile.imageAlt || profile.name;

    if (src) {
      const showImg = () => {
        photoEl.removeAttribute('hidden');
        photoFallback.setAttribute('hidden', '');
      };
      photoEl.onerror = () => {
        photoEl.setAttribute('hidden', '');
        photoFallback.textContent = profile.initials || profile.name.slice(0, 2).toUpperCase();
        photoFallback.removeAttribute('hidden');
      };
      photoEl.onload = showImg;
      photoEl.alt = alt;
      photoEl.src = src;
      if (photoEl.complete && photoEl.naturalWidth > 0) {
        showImg();
      }
    } else {
      photoEl.removeAttribute('src');
      photoEl.alt = '';
      photoEl.setAttribute('hidden', '');
      photoFallback.textContent = profile.initials || profile.name.slice(0, 2).toUpperCase();
      photoFallback.removeAttribute('hidden');
    }
  }

  function openProfile(id) {
    const profile = profiles[id];
    if (!profile) return;

    labelEl.textContent = profile.label;
    nameEl.textContent = profile.name;
    designationEl.textContent = profile.designation;
    bioEl.innerHTML = '';
    profile.bio.forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text;
      bioEl.appendChild(p);
    });

    if (profile.linkedin) {
      linkedinEl.href = profile.linkedin;
      linkedinEl.hidden = false;
    } else {
      linkedinEl.hidden = true;
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeProfile() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.wfc-profile-card[data-wfc-profile]').forEach((card) => {
    const id = card.getAttribute('data-wfc-profile');
    card.addEventListener('click', () => openProfile(id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProfile(id);
      }
    });
  });

  backdrop.addEventListener('click', closeProfile);
  closeBtn.addEventListener('click', closeProfile);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeProfile();
  });
})();
