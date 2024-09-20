import * as moment from 'moment';

export class ConsoleHelper {
	
	public static toPeso(amount: any) {
		let temp = amount;
		return temp.toLocaleString('en-US', { style: 'currency', currency: 'PhP' }).replace(/[^0-9\.\,]/g, "");
	}

	public static isUndefined(value: any) {
		return ((value === 'undefined') || (value == null) || (value == "")) ? true : false; 
	}

	public static ucFirst(str: any) {
		return str.toLowerCase().replace(/\b[a-z]/g, function (letter) {
				return letter.toUpperCase();
		});
	}

	public static log(tag: string, data: any) {	
		let today = new Date();
		let dateTime = moment(today).format("DD MM YYYY hh:mm:ss");
		console.log("==========================================");
		console.log(dateTime+" ["+ tag +"] ");
		console.log(data);
	}

}