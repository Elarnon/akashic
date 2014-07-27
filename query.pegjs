start
    = q:request? qs:(ws+ q:request { return q; })* ws* {
	if (!q) return { 'match_all': {} };
	qs.push(q);
	var filters = [], queries = [];
	qs.forEach(function (req) {
	    if (req[0] === 'filter') {
		filters.push(req[1]);
	    } else if (req[0] == 'query') {
		queries.push(req[1])
	    }
	});
	var res = {
	};
	if (filters.length > 0) {
	    res['filter'] = {
		'and': filters
	    };
	}
	if (queries.length > 0) {
	    res['query'] = {
		'bool': {
		    'should': queries
		}
	    };
	}
	return {
	    'filtered': res
	};
    }

request
    = ft:filter_token (&ws / !.) { return [ 'filter', ft ]; }
    / qt:query_token (&ws / !.) { return [ 'query', qt ]; }

filter_token
    = level_tokens
    / components
    / "registre"i 's'i? ws+ r:register regs:(ws* ',' ws* r:register { return r; })*
    {
	return {
	    'terms': {
		'school.descriptors': [r].concat(regs),
		'execution': 'and',
	    },
	};
    }
    / 'branche'i ws+ sub:subschool subs:(ws+ 'ou' ws+ s:subschool { return s; })*
    {
	return {
	    'terms': {
		'school.subschool': [sub].concat(subs)
	    }
	};
    }
    / s:school sub:(ws* '(' ws* sc:subschool ws* ')' { return sc; })?
    {
	var q = {
	    'term': { 'school.school_name': s }
	};
	if (sub) {
	    q = {
		'and': [
		    q,
		    { 'term': { 'school.subschool': sub } },
		],
	    };
	}
	return q;
    }
    / s:source { return { 'term': { 'source': s } }; }
    / '(' ws* ft:filter_token ws* ')' { return ft; }

query_token
    = '"' txt:$[^\"]* '"' {
	return {
	    'multi_match': {
		'query': txt,
		'fields': [ 'name', 'short_desc', 'description' ],
		'type': 'phrase',
	    },
	};
    }
    // / field:$[a-zéè]i+ ':' qs:query_token {
    // 	var res = {};
    // 	res[field] = qs;
    // 	return { 'field': res };
    // }
    // TODO
    / '(' ws* qs:query_token ws* ')' { return qs; }
    / txt:$(!ws .)+ {
	return {
	    'multi_match': {
		'query': txt,
		'fields': [ 'name', 'short_desc', 'description' ],
	    }
	};
    }

ws
    = [ \n]

class_
    = ("Magicien"i / "Ensorceleur"i / "Ensorceleur/Magicien"i) { return "wizard"; }
    / ("Prêtre"i / "Pretre"i) { return "cleric"; }
    / "Barde"i { return "bard"; }
    / "Paladin"i { return "paladin"; }
    / "Antipaladin"i { return "antipaladin"; }
    / ("Rôdeur"i / "Rodeur"i / "Ranger"i) { return "ranger"; }
    / "Alchimiste"i { return "alchemist"; }
    / "Druide"i { return "druid"; }
    / "Magus"i { return "magus"; }
    / ("Sorcière"i / "Sorciere"i) { return "witch"; }
    / ("Invocateur"i / "Convocateur"i) { return "summoner"; }
    / "Inquisiteur"i { return "inquisitor"; }
    / "Oracle"i { return "oracle"; }

level_tokens
    = cls:class_ levels:(ws+ lvl:[0-9]+ { return parseInt(lvl, 10); })* {
	var classFilter = {
	    'term': { 'level.class_name': cls }
	};
	if (levels.length > 0) {
	    classFilter = {
		'and': [
		    classFilter,
		    { 'terms': { 'level.class_level': levels } },
		],
	    };
	}
	return {
	    'nested': {
		'path': 'level',
		'filter': classFilter,
	    },
	};
    }

components
    = ("V"i / "verbal"i) {
	return { 'term': { 'components.verbal': true } };
    }
    / ("G"i / "gestuelle"i) {
	return { 'term': { 'components.somatic': true } };
    }
    / "F/FD"i {
	return {
	    'and': [
		{ 'term': { 'components.focus': true } },
		{ 'term': { 'components.divine_focus': true } },
	    ]
	};
    }
    / "M/FD"i {
	return {
	    'and': [
		{ 'term': { 'components.material': true } },
		{ 'term': { 'components.divine_focus': true } },
	    ]
	};
    }
    / ("FD"i / "focus"i ws+ "divin"i) {
	return { 'term': { 'components.divine_focus': true } };
    }
    / ("F"i / "focus"i) {
	return { 'term': { 'components.focus': true } };
    }
    / ("M"i / "materielle"i / "matérielle"i) {
	return { 'term': { 'components.material': true } };
    }

register
    = 'acide'i { return 'acid'; }
    / 'air'i { return 'air'; }
    / 'chaos'i { return 'chaotic'; }
    / 'froid'i { return 'cold'; }
    / ('obscurit'i [eé]i / 't'i [eé]i 'n'i [eè]i 'bre'i) 's'i? { return 'darkness'; }
    / 'mort'i { return 'death'; }
    / 'terre'i { return 'earth'; }
    / [eé]i 'lectricit'i [ée]i 'e'i? { return 'electricity'; }
    / 'mal'i { return 'evil'; }
    / ('peur'i / 'terreur'i) { return 'fear'; }
    / 'feu'i { return 'fire'; }
    / 'force'i { return 'force'; }
    / 'bien'i { return 'good'; }
    / 'langage'i { return 'language-dependent'; }
    / 'loi'i { return 'lawful'; }
    / 'lumi'i [eè]i 're'i { return 'light'; }
    / 'mental'i { return 'mind-affecting'; }
    / 'ombre'i { return 'shadow'; }
    / 'son'i { return 'sonic'; }
    / 'eau'i { return 'water'; }
    / 'mal'i [eé]i 'diction'i { return 'curse'; }
    / 'maladie'i { return 'disease'; }
    / [eé]i 'motion'i { return 'emotion'; }
    / 'douleur'i { return 'pain'; }
    / 'poison'i { return 'poison'; }

school
    = 'Abjuration'i { return 'abjuration'; }
    / ('Invocation'i / 'Conjuration'i) { return 'conjuration'; }
    / 'Divination'i { return 'divination'; }
    / 'Enchantement'i { return 'enchantment'; }
    / [EÉ]i 'vocation'i { return 'evocation'; }
    / 'Illusion'i { return 'illusion'; }
    / 'N'i [eé]i 'cromancie'i { return 'necromancy'; }
    / 'Transmutation'i { return 'transmutation'; }
    / 'Universelle'i { return 'universal'; }

subschool
    = 'Appel'i { return 'calling'; }
    / 'Cr'i [eé]i 'ation'i { return 'creation'; }
    / 'Gu'i [eé]i 'rison'i { return 'healing'; }
    / 'Convocation'i { return 'summoning'; }
    / 'T'i [eé]i 'l'i [eé]i 'portation'i { return 'teleportation'; }
    / 'Scrutation'i { return 'scrying'; }
    / 'Charme'i { return 'charm'; }
    / ('Coercition'i / 'Compulsion'i) { return 'compulsion'; }
    / 'Chim'i [eè]i 're'i { return 'figment'; }
    / 'Hallucination'i { return 'glamer'; }
    / 'Mirage'i { return 'pattern'; }
    / 'Ombre'i { return 'shadow'; }
    / 'M'i [eé]i 'tamorphose'i { return 'polymorph'; }

source = 'CRB' / 'APG' / 'UC' / 'UM'
