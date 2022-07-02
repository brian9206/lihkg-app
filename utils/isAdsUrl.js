const KNOWN_ADS_DOMAIN_LIST = [
  '2mdn.net',
  'adsense.google.com',
  'adservice.google.ca',
  'adservice.google.co',
  'adservice.google.com',
  'adservice.google.co.uk',
  'adservice.google.co.za',
  'adservice.google.de',
  'adservice.google.dk',
  'adservice.google.es',
  'adservice.google.fr',
  'adservice.google.nl',
  'adservice.google.no',
  'adservice.google.pl',
  'adservice.google.ru',
  'adservice.google.vg',
  'app-measurement.com',
  'doubleclickbygoogle.com',
  'doubleclick.com',
  'doubleclick.net',
  'googleadservices.com',
  'google-analytics.com',
  'googlesyndication.com',
  'googletagmanager.com',
  'googletagservices.com',
  'gstaticadssl.l.google.com',
  'mail-ads.google.com',
  'ssl-google-analytics.l.google.com',
  'www-googletagmanager.l.google.com',
  'ads.yap.yahoo.com',
  'pb.lihkg.com',
]

export default function isAdsUrl(url) {
  url = url.toLowerCase()

  for (const domain of KNOWN_ADS_DOMAIN_LIST) {
    if (url.indexOf(domain) !== -1) return true
  }

  return false
}
