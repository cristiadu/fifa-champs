"use strict"

const Promise = require("bluebird");
const errors = require('./../errors');
const util = require('./../utils');

const document = require('./../models/championship');

class ChampionshipController {

	constructor(mongo) {
		this.mongo = mongo;
	}
	
	getAll() {
		return this.mongo.selectAll(document).then((championships) => {
			return this._prepareToSend(championships);
		});
	}

	getById(id) {
		return this.mongo.selectById(document, id).populate({	
					path: 'matches',
    				populate: [{ 
    					path:  'player1',
     					model: 'Player'
     				},{ 
    					path:  'player2',
     					model: 'Player'
     				},{ 
    					path:  'player3',
     					model: 'Player'
     				},{ 
    					path:  'player4',
     					model: 'Player'
     				}]
     			}).exec().then((championship) => {
			return this._prepareToSend(championship);
		});
	}

	insert(championship) {
		return this.mongo.insert(new document(championship)).then((championshipSaved) => {
			return this._prepareToSend(championshipSaved);
		});
	}

	update(id, championship) {
		return this.mongo.update(document, id, championship).then((championshipSaved) => {
			return this.getById(id);
		}).bind(this).then((championshipSaved) => {
			return this._prepareToSend(championshipSaved);
		});
	}

	delete(id) {
		return this.mongo.delete(document, id).then((result) => {
			return result;
		});
	}

	_prepareToSend(championshipSaved) {
		if (Array.isArray(championshipSaved)) {
			var championships = util.copyObject(championshipSaved);
			for (var championship in championships) {
				championships[championship].date = util.formatDate(new Date(championships[championship].date));
			}
			return championships;
		}
		var championship = util.copyObject(championshipSaved);
		championship.date = util.formatDate(new Date(championship.date));
		return championship;
	}
};

module.exports = ChampionshipController;