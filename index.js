const { Client, DefaultMediaReceiver } = require('castv2-client');
const scanner = require('multicast-scanner');
const debug = require('debug')('chromecast-controller');
const noop = () => {};

const defaults =
{
	ttl: 22000,
	interval: 4000,
	name: null,
	autoplay: true
}

var controller =
{
	cast: function(media, opts, cb)
	{
		cb = cb || noop;

		if(typeof opts === 'function') cb = opts;
		else opts = opts || {};

		opts = { ...defaults, ...opts };

		if(isActive())
		{
			this._player.load(media, opts, (err, status) =>
			{
				if(err)
				{
					debug(`Could not load media: ${err.message}`);
					debug(`Could not append to session! Restarting connection...`);

					launch(media, opts, cb);
				}
				else
					cb(null);
			});
		}
		else
		{
			launch(media, opts, cb);
		}
	},

	play: function(cb)
	{
		cb = cb || noop;

		this._player.play(cb);
	},

	pause: function(cb)
	{
		cb = cb || noop;

		this._player.pause(cb);
	},

	stop: function(cb)
	{
		cb = cb || noop;

		this._player.stop(cb);
	},

	seek: function(position, cb)
	{
		cb = cb || noop;

		if(isNaN(position)) cb(new Error('Position must be a number!'));
		else this._player.seek(position, cb);
	},

	setVolume: function(volume, cb)
	{
		cb = cb || noop;

		if(volume < 0 || volume > 1)
			cb(new Error('Volume must be a number between 0 and 1!'));
		else
			this._client.setVolume({ level: volume }, cb);
	},

	getVolume: function(cb)
	{
		cb = cb || noop;

		this._client.getVolume((err, status) =>
		{
			if(err)
			{
				debug(`Could not get volume: ${err.message}`);
				cb(err);
			}
			else cb(status.level);
		});
	},

	setMuted: function(value, cb)
	{
		cb = cb || noop;
		value = (value === true || value === false) ? value : true;

		this._client.setVolume({ muted: value }, cb);
	},

	getMuted: function(cb)
	{
		cb = cb || noop;

		this._client.getVolume((err, status) =>
		{
			if(err)
			{
				debug(`Could not get mute status: ${err.message}`);
				cb(err);
			}
			else cb(status.muted);
		});
	},

	close: function(cb)
	{
		cb = cb || noop;

		closeClient((err) =>
		{
			if(err) debug(`Could not close client: ${err.message}`);

			cb(err);
		});
	},

	_player: null,
	_client: null
}

function launch(media, opts, cb)
{
	if(controller._client)
	{
		closeClient((err) =>
		{
			if(err) cb(err);
			else _scanAndPlay(media, opts, cb);
		});
	}
	else
	{
		_scanAndPlay(media, opts, cb);
	}
}

function _scanAndPlay(media, opts, cb)
{
	scanner({...opts, ...{ full_scan: false }}, (err, device) =>
	{
		if(err) return cb(err);

		controller._client = new Client();

		controller._client.connect(device.ip, (err) =>
		{
			if(err) return cb(err);

			controller._client.launch(DefaultMediaReceiver, (err, player) =>
			{
				if(err) return cb(err);

				controller._player = player;

				if(!media) cb(new Error('No media provided!'));
				else if (typeof media !== 'object') cb(new Error('Invalid media object!'));
				else controller.cast(media, opts, cb);
			});
		});

		controller._client.on('error', onError);
	});
}

function closeClient(cb)
{
	cb = cb || noop;

	debug(`Closing client...`);

	controller._client.removeListener('error', onError);

	if(isActive())
	{
		controller._client.stop(controller._player, (err) =>
		{
			controller._client.close();

			if(err) cb(err);
			else cb(null);
		});
	}
	else
	{
		controller._client.close();
		cb(null);
	}
}

function isActive()
{
	if(controller._player && controller._player.session)
	{
		debug(`Status check: player is active`);
		return true;
	}

	debug(`Status check: player inactive`);
	return false;
}

function onError(err)
{
	debug(`Client error: ${err.message}`);
	closeClient();
}

module.exports = controller;
