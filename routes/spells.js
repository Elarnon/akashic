var express = require('express');
var router = express.Router();

var elasticsearch = require('elasticsearch');

function descriptor_fr(d) {
    switch (d) {
    case 'acid': return "acide";
    case 'air': return "air";
    case 'chaotic': return "chaos";
    case 'cold': return "froid";
    case 'darkness': return "obscurité";
    case 'death': return "mort";
    case 'earth': return "terre";
    case 'electricity': return "électricité";
    case 'evil': return "mal";
    case 'fear': return "peur";
    case 'fire': return "feu";
    case 'force': return "force";
    case 'good': return "bien";
    case 'language-dependent': return "langage";
    case 'lawful': return "loi";
    case 'light': return "lumière";
    case 'mind-affecting': return "mental";
    case 'shadow': return "ombre";
    case 'sonic': return "son";
    case 'water': return "eau";
    case 'curse': return "malédiction";
    case 'disease': return "maladie";
    case 'emotion': return "émotion";
    case 'pain': return "douleur";
    case 'poison': return "poison";
    default: return '__ERROR__';
    }
}

function hit_to_spell(hit) {
    //console.log(require('util').inspect(hit, false, null));
    var fields = hit._source;
    var level = {};
    fields.level.forEach(function (lvl) {
	level[lvl.class_name] = '' + lvl.class_level; // Ugly fix because 0 is "falsy"...
    });
    return {
	"name": fields.name,
	"link": 'http://www.pathfinder-fr.org/Wiki/Pathfinder-RPG.' + fields.name.replace(/['\/]/, '') + '.ashx',
	"school": fields.school.raw,
	"descriptors": fields.school.descriptors.map(descriptor_fr),
	"source": fields.source,
	"level": level,
	"short_desc": fields.short_desc,
    };
}

router.get('/', function(req, res) {
    // We are using UTF-8 only
    if (!req.acceptsCharset('utf-8')) {
	res.send(406);
	return;
    }
    // Empty query means we want all the spells at once.
    var queryString = req.query.q || "";
    var qp = require('../query_parser');
    var query = qp.parse(queryString);
    console.log(require('util').inspect(query, false, null));

    var client = new elasticsearch.Client();
    var esQuery = {
	index: 'pathfinder',
	type: 'spell',
	size: 2000,
	body: { 'query': query },
    };
    client.search(esQuery).then(function (resp) {
	var accepted = req.accepts(['html', 'json']);
	if (!accepted) {
	    res.send(406);
	} else if ('html' == accepted) {
	    res.set('Content-Type', 'text/html; charset=utf-8');
	    res.render('spells', { spells: resp.hits.hits.map(hit_to_spell),
				   diacritics: require('diacritics'),
				   classes:
				   [ { name: "Magicien", id: "wizard", column: 5 },
				     { name: "Prêtre", id: "cleric", column: 6 },
				     { name: "Barde", id: "bard", column: 7 },
				     { name: "Paladin", id: "paladin", column: 8 },
				     { name: "Rôdeur", id: "ranger", column: 9 },
				     { name: "Alchimiste", id: "alchemist", column: 10 },
				     { name: "Druide", id: "druid", column: 11 },
				     { name: "Sorcière", id: "witch", column: 12 },
				     { name: "Conjurateur", id: "summoner", column: 13 },
				     { name: "Inquisiteur", id: "inquisitor", column: 14 },
				     { name: "Oracle", id: "oracle", column: 15 },
				     { name: "Antipaladin", id: "antipaladin", column: 16 },
				     { name: "Magus", id: "magus", column: 17 },
				   ],
				   descriptors: [
				   ],
				   query: queryString });
	} else if ('json' == accepted) {
	    res.set('Content-Type', 'application/json; charset=utf-8');
	    res.send(resp.hits.hits.map(function (hit) {
		hit = hit.fields;
		hit["school"] = hit["school.raw"];
		delete hit["school.raw"];
		return hit;
	    }));
	} else {
	    res.send(500);
	}
    });
});

module.exports = router;


// { 'level': [ 'wizard', [ 2, 3, 4 ] ] } OK
// { 'components': V/G/M/F/FD }
// { 'descriptors': [ 'air', 'feu' ] } OK
// { 'subschool': [ 'charme' ] } OK
// { 'school': 'Invocation', 'subschool': 'charme' } OK
// { 'source': 'UM' }
// { 'exact': 'text' }
