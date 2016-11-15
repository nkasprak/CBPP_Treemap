/*globals CBPP*/
(function() {
"use strict";

CBPP.Treemap.colorUtils = {
	//http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
	HSVToRGB: function(arr) {
		var h = arr[0]/360,
		s = arr[1]/100,
		v = arr[2]/100,
		r, g, b, i, f, p, q, t;
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}
		return [
			Math.floor(r * 255),
			Math.floor(g * 255),
			Math.floor(b * 255)
		];
	},
	HexToRGB : function (hexString) {
		var r = parseInt(hexString.substr(1, 2), 16);
		var g = parseInt(hexString.substr(3, 2), 16);
		var b = parseInt(hexString.substr(5, 2), 16);
		return [r, g, b];
	},
	
	//http://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript
	RGBToHSV : function(arr) {
		var r = arr[0] / 255,
		g = arr[1] / 255,
		b = arr[2] / 255,
		rr, gg, bb,
			h, s,
			v = Math.max(r, g, b),
			diff = v - Math.min(r, g, b),
			diffc = function(c){
				return (v - c) / 6 / diff + 1 / 2;
			};
			
		if (diff === 0) {
			h = s = 0;
		} else {
			s = diff / v;
			rr = diffc(r);
			gg = diffc(g);
			bb = diffc(b);
	
			if (r === v) {
				h = bb - gg;
			}else if (g === v) {
				h = (1 / 3) + rr - bb;
			}else if (b === v) {
				h = (2 / 3) + gg - rr;
			}
			if (h < 0) {
				h += 1;
			}else if (h > 1) {
				h -= 1;
			}
		}
		return [
			Math.round(h * 360),
			Math.round(s * 100),
			Math.round(v * 100)
		];
	},
	RGBToHex : function (rgbArray) {
		function pad(num, size) {
			var s = "0" + num;
			return s.substr(s.length - size);
		}
		return "#" + pad(rgbArray[0].toString(16), 2) + pad(rgbArray[1].toString(16), 2) + pad(rgbArray[2].toString(16), 2);
	}
};

})();
