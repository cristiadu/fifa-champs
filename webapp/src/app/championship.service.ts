import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ApiRequestService } from './api-request.service';
import { Championship } from './models/championship';

@Injectable()
export class ChampionshipService {

	private url = '/championships';
	private currentChampionship: Championship;
	private selectedChampionship: Championship;

	constructor(private api: ApiRequestService) { }

	insert(championship: Championship) : Observable<Championship> {
		return this.api.post(this.url, championship);
	}

	update(id, championship: Championship) : Observable<Championship> {
		delete championship._id;
		return this.api.post(this.url + '/' + id, championship);
	}

	delete(id) : Observable<Championship> {
		return this.api.delete(this.url + '/' + id);
	}

	getAll() : Observable<Championship[]> {
		return this.api.get(this.url);
	}

	getById(id) : Observable<Championship> {
		return this.api.get(this.url + '/' + id);
	}

	getCurrent() : Observable<Championship[]> {
		return this.api.get(this.url + '?isCurrent=true');
	}

	getByMonth(month, year) : Observable<Championship[]> {
		return this.api.get(this.url + '?month=' + month + '&year=' + year);
	}

	setSelectedChampionship(championship: Championship) {
		this.selectedChampionship = championship;
	}

	getSelectedChampionship() {
		return this.selectedChampionship;
	}

	setCurrentChampionship(championship: Championship) {
		this.currentChampionship = championship;
	}

	getCurrentChampionship() {
		return this.currentChampionship;
	}
}
