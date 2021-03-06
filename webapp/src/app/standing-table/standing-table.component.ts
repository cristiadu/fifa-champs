import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { Match } from './../models/match';
import { Statistics } from './../models/statistics';
import { Player } from './../models/player';
import { ChampionshipService } from './../championship.service';
import { LoginService } from './../login.service';

@Component({
	selector: 'app-standing-table',
	templateUrl: './standing-table.component.html',
	styleUrls: ['./standing-table.component.css']
})
export class StandingTableComponent implements OnChanges {

	@Input() matches : Array<Match>;
	@Input() noFilterSelected: Boolean;

	statisticsList : Array<Statistics>;
	matchesList : Array<Match>;
	days = 0;
	numberOfMatches = 0;
	limit = 0;
	players: Array<Player>;

	constructor(private championshipService : ChampionshipService, private loginService : LoginService) { }

	ngOnChanges(changes: SimpleChanges) {
		this.setLimit();
		this.players = this.getPlayersFromMatches();

		this.statisticsList = [];
		this.matchesList = [];

		this.createStatistics();

		// we should not update the stats it the statisticsList
		// contains stats for all championships
		if(!changes["noFilterSelected"]) {
			this.updateStats();
		}
	}

	getPlayersFromMatches() : Array<Player> {
		let players = [];
		for (let match in this.matches) {
			if (players.indexOf(this.matches[match].player1) < 0) {
				players.push(this.matches[match].player1);
			}
			if (players.indexOf(this.matches[match].player2) < 0) {
				players.push(this.matches[match].player2);
			}
			if (players.indexOf(this.matches[match].player3) < 0) {
				players.push(this.matches[match].player3);
			}
			if (players.indexOf(this.matches[match].player4) < 0) {
				players.push(this.matches[match].player4);
			}
		}
		return players;
	}

	updateStats() {
		// update the stats only if the user is an admin
		if(this.loginService.isLoggedIn()) {
			if(this.statisticsList.length > 0) {
				let champs = this.championshipService.getSelectedChampionship();
				// we should not add stats for an unfinished championship
				if(!champs.isCurrent){
					champs.matches = this.matchesList;
					champs.players = this.statisticsList.map(item => item.player);
				} else {
					// if the championship is unfinished, the stats must remain empty
					champs.matches = [];
					champs.players = [];
				}
				this.championshipService.update(champs._id, champs).subscribe((res) => {}, (err) => {});
			}
		}
	}

	createStatistics() {
		if (this.statisticsList && this.statisticsList.length > 0) {
			return;
		}

		let statistics = [];

		if (!this.players) {
			return;
		}

		for (let player in this.players) {
			let playerObj = this.players[player];

			if (!playerObj.nickname) {
				continue;
			}

			statistics[playerObj.nickname] = new Statistics();
			statistics[playerObj.nickname].player = playerObj;
		}

		let matchWihtoutFinal:Array<Match>;

		if(Array.isArray(this.matches))
			matchWihtoutFinal = this.matches.filter(match => match.isFinal == false);
		else
			matchWihtoutFinal = new Array<Match>();

		for (let match in matchWihtoutFinal) {
			let m = matchWihtoutFinal[match];
			this.matchesList.push(m);
			this.setStatisticOfPlayer(statistics, m.player1, m.team1score, m.team2score);
			this.setStatisticOfPlayer(statistics, m.player2, m.team1score, m.team2score);
			this.setStatisticOfPlayer(statistics, m.player3, m.team2score, m.team1score);
			this.setStatisticOfPlayer(statistics, m.player4, m.team2score, m.team1score);
		}

		for (let key in statistics) {
			this.statisticsList.push(statistics[key]);
		}
		this.statisticsList.sort((statistic1, statistic2) => {
			return this.compareStatistics(statistic1, statistic2);
		});
	}

	compareStatistics(statistic1, statistic2) {
		if (statistic1.matches >= this.limit && statistic2.matches < this.limit) {
			return -1;
		}
		if (statistic1.matches < this.limit && statistic2.matches >= this.limit) {
			return 1;
		}

		if (statistic1.percent > statistic2.percent) {
			return -1;
		}
		if (statistic1.percent < statistic2.percent) {
			return 1;
		}

		if ((statistic1.victories / statistic1.matches) > (statistic2.victories / statistic2.matches)) {
			return -1;
		}
		if ((statistic1.victories / statistic1.matches) < (statistic2.victories / statistic2.matches)) {
			return 1;
		}

		if ((statistic1.goalBalance / statistic1.matches) > (statistic2.goalBalance / statistic2.matches)) {
			return -1;
		}
		if ((statistic1.goalBalance / statistic1.matches) < (statistic2.goalBalance / statistic2.matches)) {
			return 1;
		}

		if (statistic1.goalsPerMatch > statistic2.goalsPerMatch) {
			return -1;
		}
		if (statistic1.goalsPerMatch < statistic2.goalsPerMatch) {
			return 1;
		}
		return 0;
	}

	setStatisticOfPlayer(statistics, player, team1score, team2score) {
		if (!player.nickname) {
			return;
		}
		statistics[player.nickname].player = player;
		statistics[player.nickname].matches++;
		statistics[player.nickname].goals += team1score;
		statistics[player.nickname].concededGoals += team2score;
		statistics[player.nickname].goalBalance += team1score - team2score;

		if (team1score > team2score) {
			statistics[player.nickname].victories++;
			statistics[player.nickname].score += 3;
		} else if (team1score < team2score) {
			statistics[player.nickname].defeats++;
		} else {
			statistics[player.nickname].ties++;
			statistics[player.nickname].score += 1;
		}
		statistics[player.nickname].goalsPerMatch = statistics[player.nickname].goals*1.0 / statistics[player.nickname].matches;
		statistics[player.nickname].concededGoalsPerMatch = statistics[player.nickname].concededGoals*1.0 / statistics[player.nickname].matches;
		statistics[player.nickname].percent = statistics[player.nickname].score / (3 * statistics[player.nickname].matches) * 100;
	}

	setLimit() {
		if (!this.matches || this.matches.length == 0) {
			this.days = 0;
			this.numberOfMatches = 0;
			this.limit = 0;
			return;
		}

		var days = [];
		for (let match of this.matches) {
			if (days.indexOf(match.date) < 0 && match.date != undefined && !match.isFinal) {
				days.push(match.date);
			}
		}
		this.days = days.length;
		this.numberOfMatches = this.matches.length;

		if(this.noFilterSelected){
			this.limit = Math.floor(this.numberOfMatches / 15);
		}
		else{
			this.limit = this.days;
		}
	}

	hasPlayers() {
		return this.players != null && this.players.length > 0;
	}

	getSg(statistic){
		if(statistic.goalBalance < 0)
			return 1;

		return 0;
	}

	getColor(position, statistic) {
		if (position < 4) {
			return 1;
		}
		if (statistic.matches < this.limit) {
			return 2;
		}
		return 0;
	}

	formatNumber(number) {
		return parseFloat(number).toFixed(2);
	}
}
