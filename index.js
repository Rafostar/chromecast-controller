const { Client, DefaultMediaReceiver } = require('castv2-client');
const scanner = require('multicast-scanner');
const debug = require('debug')('chromecast-controller');
const noop = () => {};

const defaults =
{
	ttl: 22000,
	interval: 4000,
	name: null,
	ip: null,
	autoplay: true,
	retry: true
}

var controller =
{
	cast: function(media, opts, cb)
	{
		cb = cb || noop;

		if(typeof opts === 'function') cb = opts;
		else opts = opts || {};

		opts = { ...defaults, ...opts };

		startCast(media, opts, cb);
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
			else
				cb(null, status.level);
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
			else
				cb(null, status.muted);
		});
	},

	getStatus: function(cb)
	{
		cb = cb || noop;

		this._player.getStatus(cb);
	},

	close: function(cb)
	{
		cb = cb || noop;

		closeClient(err =>
		{
			if(err) debug(`Could not close client: ${err.message}`);

			cb(err);
		});
	},

	_player: null,
	_client: null
}

function startCast(media, opts, cb)
{
	if(getIsActive())
	{
		controller._player.load(media, opts, (err, status) =>
		{
			if(err)
			{
				debug(`Could not load media: ${err.message}`);

				if(opts.retry)
				{
					debug('Retrying...');

					opts.retry = false;
					return _launch(media, opts, cb);
				}
			}

			cb(err, status);
		});
	}
	else
	{
		_launch(media, opts, cb);
	}
}

function _launch(media, opts, cb)
{
	var selectPlay = () =>
	{
		if(opts.ip) _connectAndPlay(media, opts, cb);
		else _scanAndPlay(media, opts, cb);
	}

	if(controller._client)
	{
		closeClient(err =>
		{
			if(err) cb(err);
			else selectPlay();
		});
	}
	else
	{
		selectPlay();
	}
}

function _scanAndPlay(media, opts, cb)
{
	scanner({ ...opts, ...{ full_scan: false }}, (err, device) =>
	{
		if(err) return cb(err);

		opts.ip = device.ip;
		_connectAndPlay(media, opts, cb);
	});
}

function _connectAndPlay(media, opts, cb)
{
	controller._client = new Client();

	controller._client.connect(opts.ip, (err) =>
	{
		if(err) return cb(err);

		controller._client.launch(DefaultMediaReceiver, (err, player) =>
		{
			if(err) return cb(err);
			else
			{
				controller._player = player;
				controller._player.on('close', onClose);

				if(!media)
					cb(new Error('No media provided!'));
				else if(typeof media !== 'object')
					cb(new Error('Invalid media object!'));
				else
					startCast(media, opts, cb);
			}
		});
	});

	controller._client.on('error', onError);
}

function closeClient(cb)
{
	cb = cb || noop;

	debug(`Closing client...`);

	controller._client.removeListener('error', onError);

	if(controller._player)
		controller._player.removeListener('close', onClose);

	var close = () =>
	{
		controller._client.close();
		controller._client = null;
		debug('Closed client');
	}

	if(getIsActive())
	{
		controller._client.stop(controller._player, (err) =>
		{
			close();

			if(err) cb(err);
			else cb(null);
		});
	}
	else
	{
		close();
		cb(null);
	}
}

function getIsActive()
{
	if(controller._player && controller._player.session)
	{
		debug(`Status check: player is active`);
		return true;
	}

	debug(`Status check: player inactive`);
	return false;
}

function onClose()
{
	debug(`Player close event`);
	closeClient();
}

function onError(err)
{
	debug(`Client error: ${err.message}`);
	closeClient();
}

module.exports = controller;
