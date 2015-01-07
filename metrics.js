(function(){

	var Metrics = function(){

		this.user = {};
		this.services = {};

		// Get trace of all events and updates.
		this.events = [];
		this.updates = [];

		this.registerDatas = null;
		this.registerOnceDatas = null;

		// Call all services init with at least an id.
		// All init function set this.services[service] with an id.
		this.initServices = function(services, user){
			if(user) this.user = user;

			for(var service in services){
				if(this['init'+service]) this['init'+service](services[service]);
			}
			
			return this;
		}

		// To create new instance of a service.
		this.newInstances = function(services){
			for(var service in services){
				if(this.services[service] && this['newInstance'+service]) this['newInstance'+service](services[service]);
			}

			return this;
		}

		// This function is call by userSignup and userSignin.
		// It should not be call in oter case.
		this.setServices = function(settings){
			for(var service in this.services){
				if(this['set'+service]) this['set'+service](settings);
			}

			return this;
		}

		// Call only when user signup. Some services need specials events for signup.
		this.userSignup = function(userId, userEmail, settings){
			this.user._id = userId;
			this.user.email = userEmail;

			for(var service in this.services){
				if(this['setUp'+service]) this['setUp'+service](userId);
			}

			this.setServices(settings);

			this.events.push('Signup');

			return this;
		}

		this.userSignin = function(userId, userEmail, settings){
			this.user._id = userId || this.user._id;
			this.user.email = userEmail || this.user.email;

			this.setServices(settings);

			this.events.push('Signin');

			return this;
		}

		this.userLogout = function(){
			this.user = {};

			for(var service in this.services){
				if(this['shutdown'+service]) this['shutdown'+service]();
			}

			this.events.push('Logout');

			return this;
		}

		// send({name: 'test', data:{test:'test'}}, ['GA', 'MP', 'IC'])
		this.send = function(e, services){
			if((this.registerDatas || this.registerOnceDatas) && !e.data) e.data = {};

			if(this.registerDatas){
				for(var data in this.registerDatas){
					if(e.data[data] === undefined) e.data[data] = this.registerDatas[data];
				}
			}

			if(this.registerOnceDatas){
				for(var data in this.registerDatas){
					if(e.data[data] === undefined) e.data[data] = this.registerOnceDatas[data];
				}

				this.registerOnceDatas = null;
			}

			var dataString = JSON.stringify(e);

			for(var i = 0; i < services.length; i++){
				if(this.services[services[i]] && this['send'+services[i]]) {
					this['send'+services[i]](JSON.parse(dataString));
				}
			}

			this.events.push({
				name: e.name,
				event : JSON.parse(dataString),
				services: services
			});

			return this;
		}

		var Clone = function(obj){
			for(var ppt in obj){
				if(obj[ppt] instanceof Date){
					this[ppt] = new Date(obj[ppt]);
				} else {
					this[ppt] = obj[ppt];
				}
			}
		}

		// update({test: 'test', nb_test: 10, data_test: new Date()}, ['GA', 'MP', 'IC'])
		this.update = function(datas, services){
			for(var i = 0; i < services.length; i++){
				if(this.services[services[i]] && this['update'+services[i]]){
					this['update'+services[i]](new Clone(datas));
				}
			}

			for(var data in datas){
				this.user[data] = datas[data];
			}

			this.updates.push({
				datas: datas,
				services: services
			});

			return this;
		}

		this.register = function(datas){
			if(!this.registerDatas) this.registerDatas = {};

			for(var data in datas){
				this.registerDatas[data] = datas[data];
			}

			return this;
		}

		this.registerOnce = function(datas){
			if(!this.registerOnceDatas) this.registerOnceDatas = {};

			for(var data in datas){
				this.registerOnceDatas[data] = datas[data];
			}

			return this;
		}

		this.unregister = function(one, two){
			if(one && this.registerDatas) {
				if(one === true) {
					this.registerDatas = null;
				} else {
					for(var i = 0; i < one.length; i++){
						if(this.registerDatas[one[i]]) delete this.registerDatas[one[i]];
					}
				}
			}
			if(two && this.registerOnceDatas) {
				if(two === true) {
					this.registerDatas = null;
				} else {
					for(var i = 0; i < two.length; i++){
						if(this.registerDatas[two[i]]) delete this.registerDatas[two[i]];
					}
				}
			}

			return this;
		}

		/***** GoogleAnalytics [GA] *****/

		/* init : 	scriptName string
					params object
		*/

		var _ga = undefined;

		this.initGA = function(GA){
			if(!GA.trackingId) return;

			(function(i, s, o, g, r, a, m) {
				i['GoogleAnalyticsObject'] = r;
				i[r] = i[r] || function() {
					(i[r].q = i[r].q || []).push(arguments)
				}, i[r].l = 1 * new Date();
				a = s.createElement(o),
				m = s.getElementsByTagName(o)[0];
				a.async = 1;
				a.src = g;
				m.parentNode.insertBefore(a, m)
			})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

			this.services.GA = GA.trackingId;

			_ga = GA.params.name ? GA.params.name + '.' : '';
			
			ga('create', GA.trackingId, GA.params);
			ga('require', 'displayfeatures');
			ga(_ga + 'send', 'pageview');

			return ga;
		}

		this.sendGA = function(e){
			ga(_ga + 'send', 'event', e.name, e.action || ' ', e.label || '', e.value || null);
		}

		this.newInstanceGA = function(GA){
			if(GA.params.name){
				ga('create', GA.trackingId, GA.params);
				ga(GA.params.name + '.send', 'pageview');
			} else console.error('No name for new GoogleAnalytics instance');
		}

		/***** MixPanel [MP] *****/
		this.initMP = function(MP){
			if(!MP.apiToken) return;

			(function(e, b) {
				if (!b.__SV) {
					var a, f, i, g;
					window.mixpanel = b;
					a = e.createElement("script");
					a.type = "text/javascript";
					a.async = !0;
					a.src = ("https:" === e.location.protocol ? "https:" : "http:") + '//cdn.mxpnl.com/libs/mixpanel-2.2.min.js';
					f = e.getElementsByTagName("script")[0];
					f.parentNode.insertBefore(a, f);
					b._i = [];
					b.init = function(a, e, d) {
						function f(b, h) {
							var a = h.split(".");
							2 == a.length && (b = b[a[0]], h = a[1]);
							b[h] = function() {
								b.push([h].concat(Array.prototype.slice.call(arguments, 0)))
							}
						}
						var c = b;
						"undefined" !==
							typeof d ? c = b[d] = [] : d = "mixpanel";
						c.people = c.people || [];
						c.toString = function(b) {
							var a = "mixpanel";
							"mixpanel" !== d && (a += "." + d);
							b || (a += " (stub)");
							return a
						};
						c.people.toString = function() {
							return c.toString(1) + ".people (stub)"
						};
						i = "disable track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config people.set people.set_once people.increment people.append people.track_charge people.clear_charges people.delete_user".split(" ");
						for (g = 0; g < i.length; g++) f(c, i[g]);
						b._i.push([a, e, d])
					};
					b.__SV = 1.2
				}
			})(document, window.mixpanel || []);

			this.services.MP = MP.apiToken;

			mixpanel.init(MP.apiToken, MP.config);

			return mixpanel;
		}

		this.setMP = function(settings){
			mixpanel.identify(settings.user_id || this.user._id);

			var userEmail = settings.email || this.user.email;
			if(userEmail) {
				mixpanel.people.set({
					$email:userEmail  
				});
			}
		}

		this.setUpMP = function(userId){
			mixpanel.alias(userId);
		}

		this.sendMP = function(e){
			mixpanel.track(e.name, e.data);
		}

		this.updateMP = function(datas){
			mixpanel.people.set(datas);
		}

		this.newInstanceMP = function(MP){
			if(MP.name) {
				mixpanel.init(MP.apiToken, MP.config, MP.name);
			} else console.error('No name for new MixPanel instance')
		}

		/***** InterCom [IC] *****/
		this.initIC = function(IC){
			if(!IC.app_id) return;

			// (function(){
			// 	var w=window;var ic=w.Intercom;
			// 	if(typeof ic==="function"){ic('reattach_activator');ic('update',intercomSettings);}
			// 	else{
			// 		var d=document;
			// 		var i=function(){i.c(arguments)};i.q=[];
			// 		i.c=function(args){i.q.push(args)};w.Intercom=i;function l(){var s=d.createElement('script');
			// 		s.type='text/javascript';s.async=true;s.src='https://static.intercomcdn.com/intercom.v1.js';
			// 		var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);}
			// 		l();
			// 		if(w.attachEvent){w.attachEvent('onload',l);}
			// 		else{w.addEventListener('load',l,false);}
			// 	}
			// })();
			
			(function(){
				var w=window;var ic=w.Intercom;
				if(typeof ic==="function"){ic('reattach_activator');ic('update',intercomSettings);}
				else{
					var d=document;
					var i=function(){i.c(arguments)};i.q=[];
					i.c=function(args){i.q.push(args)};
					w.Intercom=i;function l(){
						var s=d.createElement('script');
						s.type='text/javascript';s.async=true;
						s.src='https://widget.intercom.io/widget/' + IC.app_id;
						var x=d.getElementsByTagName('script')[0];
						x.parentNode.insertBefore(s,x);
					}
					l();
					//if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}
				}
			})();

			this.services.IC = IC.app_id;

			return window.Intercom;
		}

		this.setIC = function(settings){
			settings.app_id = settings.app_id || this.services.IC;
			settings.user_id = settings.user_id || this.user._id;
			settings.email = settings.email || this.user.email;

			window.Intercom('boot', settings);
		}

		this.shutdownIC = function(){
			Intercom('shutdown');
		}

		this.sendIC = function(e){
			Intercom('trackEvent', e.name, e.data);
		}

		this.updateIC = function(datas){
			for(var data in datas){
				if(datas[data].getTime) datas[data] = Math.round(datas[data].getTime()/1000);
			}

			Intercom('update', datas);
		}

	}

	window.metrics = new Metrics();

	if (typeof define === 'function' && define.amd) {
	    define('metricsjs', function() {
	      	return metrics;
	    });
  	}

})();