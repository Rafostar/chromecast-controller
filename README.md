# chromecast-controller
[![License](https://img.shields.io/github/license/Rafostar/chromecast-controller.svg)](https://github.com/Rafostar/chromecast-controller/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/chromecast-controller.svg)](https://www.npmjs.com/package/chromecast-controller)
[![Downloads](https://img.shields.io/npm/dt/chromecast-controller.svg)](https://www.npmjs.com/package/chromecast-controller)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TFVDFD88KQ322)
[![Donate](https://img.shields.io/badge/Donate-PayPal.Me-lightgrey.svg)](https://www.paypal.me/Rafostar)

Easily cast to Chromecast and control playback

### Usage Example
```javascript
var chromecast = require('chromecast-controller');

var media = {
	contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
	contentType: 'video/mp4',
	streamType: 'BUFFERED'
}

chromecast.cast(media, (err) =>
{
	if(err)
	{
		chromecast.close();
		return console.log(err.message);
	}

	console.log('Playing...');
}
```

## Donation
If you like my work please support it by buying me a cup of coffee :-)

[![PayPal](https://github.com/Rafostar/gnome-shell-extension-cast-to-tv/wiki/images/paypal.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TFVDFD88KQ322)
