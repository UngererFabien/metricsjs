## Metrics.js

### Best practices

Nom des events et properties : préférer user_name à userName.

GoogleAnalytics sert à mesuré l'activité.
On y envoit les events comme user_logged et page_view pour se rendre compte de l'activité général sur le site.

MixPanel sert à analysé le comportement des user.
On y envoit les events d'un funnel et des propriétés déstiné a caractérisé le type de user.

InterCom sert à contacter le user.
On y envoit des events pour déclancher un message automatique et des propriétés pour contacter un certain type de user.

* [initServies](#initservices)
* [newInstances](#newinstances)
* [userSignup](#usersignup)
* [userSignin](#usersignin)
* [userLogout](#userlogout)
* [send](#send)
* [update](#update)
* [register](#register)
* [registerOnce](#registeronce)
* [unregister](#unregister)
* [chaining](#chaining)

### initServices

function({services}, {user})

Pour chaque {services}, appel la fonction init du service.

	metrics.initServices({
		GA: {trackingId: 'UA-XXXXXXXX-X'},
		MP: {apiToken: 'abc123456789'},
		IC: {app_id: 'abc123456789'}
	})

Chaque service init se retrouve dans metrics.services :

	metrics.services // Object {GA: "UA-XXXXXXXX-X", MP: "abc123456789", IC: "abc123456789"}

Si {user} est passer en argument metrics.user = {user}. 

Seul metrics.user._id et metrics.user.email sont utilisé par metrics.js. Les autres properties du user sont disponible uniquement pour le debug.

### newInstances

function({services})

Pour chaque {services}, appel la fonction newInstance du service.

	metrics.newInstances({
		GA: {
			trackingId: 'UA-XXXXXXXX-X',
			params: {
				name: 'ga_2'
			}
		}
	})

### userSignup

function('userId', 'userEmail', {settings})

Pour chaque services init, appel la fonction setUp du service avec {settings} en argument.
Puis pour chaque services init, appel la fonction set du service avec {settings} en argument.

	metrics.userSignup('user1234', 'user@mail.com', {
		user_hash: 'user_hash' // used by intercom for security
	})

Equivaut a metrics.userSignin mais certain services ont besoins de setUp spécifique à la première connexion d'un user.

### userSignin

function('userId', 'userEmail', {settings})

Pour chaque services init, appel la fonction set du service avec {settings} en argument.

	metrics.userSignin('user1234', 'user@mail.com', {
		user_hash: 'user_hash' // used by intercom for security
	})

### userlogout

function()

Reinitialise metrics.user et ferme certain services.

### send

function({event}, ['services'])

Envoit un event sur chaque services spécifiés.

	metrics.send({
		name: 'eventName',
		action: 'action', // optional only GA
		label: 'label' // optional onnly GA
		value: 1234, // optional only GA
		data: {data} // optional
	}, ['GA', 'MP', 'IC'])

	// Or more simple

	metrics.send({name: 'eventname'}, ['GA', 'MP', 'IC'])

L'historique des events est disponible dans metrics.events.

### update

function({data}, ['services'])

Set les {data} sur le user en cour pour chaque services spécifiés.

	metrics.update({
		name: 'John Doe'
	}, ['MP', 'IC'])

L'historique des updates est disponible dans metrics.updates.

L'état actuel du user (tout service confondu) est disponible sur metrics.user.

### register

function({data})

Chaque appel à metrics.send se fera avec les {data} register.

	metrics.register({
		page: 'homepage'
	})

	metrics.send({name: 'click_cta'}, ['MP'])

	metrics.events // [{name: 'click_cta', event: {name: 'click_cta', data: {page: 'homepage'}}, services: ['MP']}]

### registerOnce

function({data})

Equivaut à register mais est appliqué uniquement sur le prochain send.

### unregister

function(['data'] || bool, ['data'] || bool)

Le premier argument unregister les data register via register.
Le deuxième argument unregister les data register via registerOnce.

Si bool === true toutes les data précédement register sont unregister.

### Chaining

Toutes les fonctions de metrics revoit metrics. Il est donc possible de chain les appels.

	metrics.send({name: 'click_cta'}, ['GA'])
		.update({country: 'France'}, ['MP'])

<!-- ## Services

* [InterCom](#intercom)
	* [send](#sendic)
* [GoogleAnalytics](#googleanalytics) -->