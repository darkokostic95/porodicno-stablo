// Početni podaci porodice Kostić. Učitavaju se kad se stranica otvori prvi put
// (ili preko „Vrati početne podatke“). Sve dalje izmene čuvaju se u pretraživaču.
window.POCETNI_PODACI = (() => {
  const people = {};
  const families = [];
  const P = (id, first, last, gender, extra = {}) => {
    people[id] = { id, first, last, nick: '', gender, birth: '', death: '', birthPlace: '', deathPlace: '', maiden: '', photo: '', bio: '', ...extra };
  };
  const F = (id, partners, children) => families.push({ id, partners, children });

  // Nikola i Taska, njihova deca
  P('nikola', 'Nikola', 'Kostić', 'm');
  P('taska', 'Taska', 'Kostić', 'f');
  P('mile', 'Milorad', 'Kostić', 'm', { nick: 'Mile' });
  P('dusan', 'Dušan', 'Kostić', 'm');
  P('sava', 'Sava', 'Kostić', 'm');
  P('mirka', 'Mirka', 'Kostić', 'f');
  P('petkana', 'Petkana', 'Kostić', 'f');
  P('darinka', 'Darinka', 'Kostić', 'f');
  P('dara', 'Dara', 'Kostić', 'f');
  F('f-nikola', ['nikola', 'taska'], ['mile', 'dusan', 'sava', 'mirka', 'petkana', 'darinka', 'dara']);

  // Jelina porodica, Nikolić (otac nepoznat)
  P('ljubica', 'Ljubica', 'Nikolić', 'f', { nick: 'Ljuba' });
  P('mile-j', 'Mile', 'Nikolić', 'm', { bio: 'Jelin brat.' });
  P('branko', 'Branko', 'Nikolić', 'm', { bio: 'Jelin brat. Otputovao u Urugvaj.' });
  P('jela', 'Jelena', 'Kostić', 'f', { nick: 'Jela', maiden: 'Nikolić' });
  F('f-ljubica', ['ljubica'], ['mile-j', 'branko', 'jela']);

  // Mile i Jela
  P('miodrag', 'Miodrag', 'Kostić', 'm');
  P('milica-k', 'Milica', 'Kostić', 'f', { bio: 'Miodragova rođena sestra. Umrla kao dete, sa tri godine.\n\nIme treba proveriti.' });
  F('f-mile', ['mile', 'jela'], ['miodrag', 'milica-k']);

  // Radmilina porodica, Miljković
  P('vladimir', 'Vladimir', 'Miljković', 'm', { nick: 'Vlajko' });
  P('mica', 'Milica', 'Miljković', 'f', { nick: 'Mica' });
  P('bosiljka', 'Bosiljka', 'Miljković', 'f', { nick: 'Boska', bio: 'Nije imala dece.' });
  P('smilja', 'Smilja', 'Miljković', 'f');
  P('danica', 'Danica', 'Miljković', 'f', { nick: 'Dana' });
  P('radmila', 'Radmila', 'Kostić', 'f', { maiden: 'Miljković' });
  F('f-vladimir', ['vladimir', 'mica'], ['bosiljka', 'smilja', 'danica', 'radmila']);
  P('milan', 'Milan', '', 'm');
  P('bratislav', 'Bratislav', '', 'm');
  F('f-smilja', ['smilja'], ['milan', 'bratislav']);
  P('nebojsa', 'Nebojša', '', 'm');
  P('dragan', 'Dragan', '', 'm');
  F('f-danica', ['danica'], ['nebojsa', 'dragan']);

  // Miodrag i Radmila
  P('zoran', 'Zoran', 'Kostić', 'm');
  P('goran', 'Goran', 'Kostić', 'm');
  F('f-miodrag', ['miodrag', 'radmila'], ['zoran', 'goran']);

  // Zoran i Biljana, Goran i Milica
  P('biljana', 'Biljana', 'Kostić', 'f');
  P('darko', 'Darko', 'Kostić', 'm');
  P('david', 'David', 'Kostić', 'm');
  F('f-zoran', ['zoran', 'biljana'], ['darko', 'david']);
  P('milica-g', 'Milica', 'Kostić', 'f');
  P('tijana', 'Tijana', 'Kostić', 'f');
  P('miona', 'Miona', 'Kostić', 'f');
  F('f-goran', ['goran', 'milica-g'], ['tijana', 'miona']);

  return { version: 1, rev: 3, title: 'Porodica Kostić', root: 'nikola', people, families, settings: { theme: 'pergament', script: 'cyr' } };
})();
