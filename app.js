/* MCTiers Rebirth tier list. Reads data/players.json, which the bot uploads. */
(() => {
  'use strict';

  // Set this to your Discord invite (for example https://discord.gg/abc) to show the Discord link.
  const DISCORD_INVITE = '';

  const GAMEMODES = [
    { key: 'vanilla', title: 'Vanilla', icon: 'assets/icons/vanilla.png' },
    { key: 'uhc', title: 'UHC', icon: 'assets/icons/uhc.png' },
    { key: 'pot', title: 'Pot', icon: 'assets/icons/pot.png' },
    { key: 'nethop', title: 'NethPot', icon: 'assets/icons/nethpot.png' },
    { key: 'smp', title: 'SMP', icon: 'assets/icons/smp.png' },
    { key: 'sword', title: 'Sword', icon: 'assets/icons/sword.png' },
    { key: 'axe', title: 'Axe', icon: 'assets/icons/axe.png' },
    { key: 'mace', title: 'Mace', icon: 'assets/icons/mace.png' },
    { key: 'spear', title: 'Spear', icon: 'assets/icons/spear.png' },
  ];

  // HT1 .. LT5. Index = (tier - 1) * 2 + pos, where pos 0 = high, 1 = low.
  const POINTS = [60, 45, 30, 20, 10, 6, 4, 3, 2, 1];

  const TITLES = [
    { min: 400, name: 'Combat Grandmaster', color: '#f4b62b' },
    { min: 250, name: 'Combat Master', color: '#e9a93a' },
    { min: 100, name: 'Combat Ace', color: '#e5484d' },
    { min: 50, name: 'Combat Specialist', color: '#a463e8' },
    { min: 20, name: 'Combat Cadet', color: '#4fa6f0' },
    { min: 10, name: 'Combat Novice', color: '#3fb35d' },
    { min: 0, name: 'Rookie', color: '#8a94a8' },
  ];

  const REGIONS = { eu: 'EU', nasa: 'NA/SA', asau: 'AS/AU' };
  const REGION_NAMES = { eu: 'Europe', nasa: 'North and South America', asau: 'Asia and Australia' };

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const tierCode = (t) => `${t.pos === 1 ? 'LT' : 'HT'}${t.tier}`;
  const tierValue = (t) => (t.tier - 1) * 2 + (t.pos === 1 ? 1 : 0);
  const pointsOf = (t) => POINTS[tierValue(t)] ?? 0;
  const titleOf = (points) => TITLES.find((t) => points >= t.min);
  const head = (p, size = 32) => `https://mc-heads.net/avatar/${p.uuid}/${size}`;
  const bust = (p) => `https://visage.surgeplay.com/bust/128/${p.uuid}`;
  const iconOf = (key) => GAMEMODES.find((g) => g.key === key)?.icon;

  let players = [];

  // ---------- icons ----------
  const TROPHY = '<svg viewBox="0 0 24 24"><path d="M6 3h12v2h3v3a4 4 0 0 1-4 4h-.4A6 6 0 0 1 13 15.8V18h3v3H8v-3h3v-2.2A6 6 0 0 1 7.4 12H7a4 4 0 0 1-4-4V5h3zm0 4H5v1a2 2 0 0 0 1.2 1.8C6.1 9.2 6 8.6 6 8zm12 0v1c0 .6-.1 1.2-.2 1.8A2 2 0 0 0 19 8V7z"/></svg>';
  const trophyImg = 'assets/icons/trophy.svg';
  const CHEV_HT = '<svg class="chev" viewBox="0 0 24 24"><path d="m6 12 6-6 6 6M6 18l6-6 6 6"/></svg>';
  const CHEV_LT = '<svg class="chev" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>';
  const titleIcon = (color) =>
    `<svg class="title-icon" viewBox="0 0 24 24"><path d="M12 2 21 12 12 22 3 12z" stroke="${color}" stroke-width="2.4"/><path d="M12 7.5 16.5 12 12 16.5 7.5 12z" fill="${color}" stroke="none"/></svg>`;

  // ---------- data ----------
  function prepare(data) {
    return (data.players || []).map((p) => {
      const tiers = Object.entries(p.tiers || {})
        .filter(([, t]) => t && t.tier >= 1 && t.tier <= 5)
        .map(([key, t]) => ({ key, ...t }))
        .sort((a, b) => tierValue(a) - tierValue(b));
      const points = tiers.reduce((sum, t) => sum + pointsOf(t), 0);
      return { ...p, tiers, points, best: tiers[0] ? tierValue(tiers[0]) : 99 };
    });
  }

  function overallOrder() {
    const list = players.filter((p) => p.tiers.length)
      .sort((a, b) => b.points - a.points || a.best - b.best || a.name.localeCompare(b.name));
    let rank = 0;
    list.forEach((p, i) => {
      if (i === 0 || p.points !== list[i - 1].points) rank = i + 1;
      p.rank = rank;
    });
    return list;
  }

  // ---------- views ----------
  function renderTabs(active) {
    const tabs = [{ key: 'overall', title: 'Overall', icon: trophyImg }, ...GAMEMODES];
    $('#tabs').innerHTML = tabs.map((t) =>
      `<a class="tab${t.key === active ? ' active' : ''}" href="#${t.key}" role="tab">
        <img src="${t.icon}" alt="">${esc(t.title)}</a>`).join('');
  }

  function tierBadge(t) {
    return `<div class="tier-badge t${t.tier}${t.retired ? ' retired' : ''}" title="${esc(GAMEMODES.find((g) => g.key === t.key)?.title ?? t.key)}: ${tierCode(t)}">
      <div class="tier-ring"><img src="${iconOf(t.key)}" alt=""></div>
      <span class="tier-label">${tierCode(t)}</span></div>`;
  }

  function regionBadge(region) {
    return region && REGIONS[region]
      ? `<span class="region region-${region}">${REGIONS[region]}</span>`
      : '<span class="region region-none">-</span>';
  }

  function renderOverall() {
    const list = overallOrder();
    if (!list.length) return '<div class="empty-state">No players have been tested yet.</div>';
    return `<div class="overall-head"><span>#</span><span>PLAYER</span><span>REGION</span><span>TIERS</span></div>` +
      list.map((p) => {
        const title = titleOf(p.points);
        return `<div class="overall-row rank-${p.rank}" data-uuid="${esc(p.uuid)}">
          <div class="rank-cell"><div class="rank-plate"></div><span class="rank-num">${p.rank}.</span>
            <img class="rank-skin" src="${bust(p)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${head(p, 56)}'"></div>
          <div class="name-cell"><div class="player-name">${esc(p.name)}</div>
            <div class="player-title">${titleIcon(title.color)}${title.name} <small>(${p.points} points)</small></div></div>
          <div class="region-cell">${regionBadge(p.region)}</div>
          <div class="tiers-cell">${p.tiers.map(tierBadge).join('')}</div>
        </div>`;
      }).join('');
  }

  function renderGamemode(key) {
    const cols = [1, 2, 3, 4, 5].map((tier) => {
      const rows = players
        .map((p) => ({ p, t: p.tiers.find((t) => t.key === key) }))
        .filter((x) => x.t && x.t.tier === tier)
        .sort((a, b) => a.t.pos - b.t.pos || a.p.name.localeCompare(b.p.name));
      const trophy = tier <= 3 ? TROPHY : '';
      return `<div class="col col-${tier}">
        <div class="col-head">${trophy}<span>Tier ${tier}</span></div>
        <ul class="col-list">${rows.length ? rows.map(({ p, t }) =>
          `<li class="col-item r-${esc(p.region || 'none')}${t.pos === 1 ? ' lt' : ' ht'}${t.retired ? ' retired' : ''}" data-uuid="${esc(p.uuid)}" title="${tierCode(t)}">
            <img src="${head(p, 24)}" alt="" loading="lazy"><span class="n">${esc(p.name)}</span>${t.pos === 1 ? CHEV_LT : CHEV_HT}</li>`).join('')
          : '<li class="col-empty">No players</li>'}</ul></div>`;
    });
    return `<div class="columns">${cols.join('')}</div>`;
  }

  function route() {
    const key = location.hash.slice(1).toLowerCase();
    const active = GAMEMODES.some((g) => g.key === key) ? key : 'overall';
    renderTabs(active);
    $('#view').innerHTML = active === 'overall' ? renderOverall() : renderGamemode(active);
    document.title = active === 'overall' ? 'MCTiers Rebirth' : `${GAMEMODES.find((g) => g.key === active).title} | MCTiers Rebirth`;
  }

  // ---------- modals ----------
  function openModal(html) {
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
  }
  function closeModal() { $('#modal').hidden = true; }

  function openProfile(uuid) {
    const p = players.find((x) => x.uuid === uuid);
    if (!p) return;
    const ranked = overallOrder().find((x) => x.uuid === uuid);
    const title = titleOf(p.points);
    const rank = ranked?.rank;
    const ring = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'plain';
    openModal(`<div class="profile">
      <div class="profile-avatar ring-${ring}"><img src="${bust(p)}" alt="" onerror="this.onerror=null;this.src='${head(p, 128)}'"></div>
      <h2>${esc(p.name)}</h2>
      <div class="title-pill" style="--c:${title.color}">${titleIcon(title.color)}${title.name}</div>
      <div class="region-name">${p.region && REGION_NAMES[p.region] ? REGION_NAMES[p.region] : 'Unknown region'}</div>
      <a class="namemc" href="https://namemc.com/profile/${esc(p.uuid)}" target="_blank" rel="noopener">
        <span class="namemc-logo">n</span>NameMC
        <svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>
      <h3>POSITION</h3>
      <div class="position rank-${rank ?? 0}">
        <div class="position-plate"><span>${rank ? `${rank}.` : '-'}</span></div>
        <img src="${trophyImg}" alt="" class="position-trophy">
        <b>OVERALL</b><small>(${p.points} points)</small>
      </div>
      <h3>TIERS</h3>
      <div class="profile-tiers">${p.tiers.length ? p.tiers.map((t) => {
        const peak = t.peakTier && (t.peakTier !== t.tier || t.peakPos !== t.pos) ? ` (peak ${tierCode({ tier: t.peakTier, pos: t.peakPos })})` : '';
        return tierBadge(t).replace(/title="([^"]*)"/, (m, x) => `title="${x}${peak}"`);
      }).join('') : '<span class="none">Not ranked yet.</span>'}</div></div>`);
  }

  function openInfo() {
    const rows = [1, 2, 3, 4, 5].map((tier) =>
      `<tr><td>Tier ${tier}</td><td>HT${tier}: ${POINTS[(tier - 1) * 2]}</td><td>LT${tier}: ${POINTS[(tier - 1) * 2 + 1]}</td></tr>`).join('');
    openModal(`<div class="info">
      <h2>Information</h2>
      <p>Every player on this list was tested by an MCTiers Rebirth tester in our Discord server. Tier 1 is the highest tier and Tier 5 the lowest. Each tier has a high (HT) and a low (LT) half.</p>
      <p>In a gamemode tab, two arrows next to a name mean high tier and one arrow means low tier. The coloured line shows the player's region: green for EU, red for NA/SA and beige for AS/AU.</p>
      <p>The overall ranking adds up points from every gamemode:</p>
      <table><tr><th></th><th>High</th><th>Low</th></tr>${rows}</table>
      <p>Titles: ${TITLES.slice().reverse().map((t) => `${t.name} (${t.min}+)`).join(', ')}.</p>
      <p>Want to get tested? Join our Discord server and enter the waitlist.</p>
    </div>`);
  }

  // ---------- search ----------
  let matches = [];
  let activeMatch = 0;
  function renderSearch() {
    const q = $('#search').value.trim().toLowerCase();
    const box = $('#searchResults');
    if (!q) { box.hidden = true; return; }
    matches = players.filter((p) => p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q) || a.name.localeCompare(b.name))
      .slice(0, 8);
    activeMatch = 0;
    box.innerHTML = matches.length
      ? matches.map((p, i) => `<li data-uuid="${esc(p.uuid)}" class="${i === 0 ? 'active' : ''}"><img src="${head(p, 24)}" alt="">${esc(p.name)}</li>`).join('')
      : '<li class="empty">No player found</li>';
    box.hidden = false;
  }
  function pick(uuid) {
    $('#search').value = '';
    $('#searchResults').hidden = true;
    $('#search').blur();
    openProfile(uuid);
  }

  // ---------- wiring ----------
  function timeAgo(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} minutes ago`;
    if (s < 86400 * 2) return `${Math.round(s / 3600)} hours ago`;
    return `${Math.round(s / 86400)} days ago`;
  }

  async function init() {
    if (DISCORD_INVITE) { $('#discordLink').href = DISCORD_INVITE; $('#discordLink').hidden = false; }

    window.addEventListener('hashchange', route);
    $('#view').addEventListener('click', (e) => {
      const el = e.target.closest('[data-uuid]');
      if (el) openProfile(el.dataset.uuid);
    });
    $('#infoBtn').addEventListener('click', openInfo);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('.modal-close')) closeModal(); });
    $('#search').addEventListener('input', renderSearch);
    $('#search').addEventListener('keydown', (e) => {
      const items = [...$('#searchResults').querySelectorAll('li[data-uuid]')];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        activeMatch = (activeMatch + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
        items.forEach((li, i) => li.classList.toggle('active', i === activeMatch));
      } else if (e.key === 'Enter' && matches[activeMatch]) {
        pick(matches[activeMatch].uuid);
      } else if (e.key === 'Escape') {
        $('#search').value = ''; renderSearch(); $('#search').blur();
      }
    });
    $('#searchResults').addEventListener('mousedown', (e) => {
      const li = e.target.closest('li[data-uuid]');
      if (li) { e.preventDefault(); pick(li.dataset.uuid); }
    });
    $('#search').addEventListener('blur', () => setTimeout(() => { $('#searchResults').hidden = true; }, 100));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === '/' && document.activeElement !== $('#search')) { e.preventDefault(); $('#search').focus(); }
    });

    route();
    try {
      const res = await fetch(`data/players.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      players = prepare(data);
      if (data.updated) $('#updated').textContent = `Updated ${timeAgo(data.updated)}`;
    } catch {
      $('#updated').textContent = 'Could not load the tier list.';
    }
    route();
  }

  init();
})();
