/*globals CBPP*/
CBPP.Treemap.returnCoords = function(d, width, height, layoutOverride) {
	"use strict";
	if (typeof(layoutOverride)==="undefined") {layoutOverride = null;}
	
	var getTotal,recurse,recursionLevel=0,returnBoxes = [], layoutDef = {};
	
	getTotal = function(dataArr) {
		var total = 0;
		switch(typeof(dataArr)) {
			case "object":
			for (var j=0;j<dataArr.length;j++) {
				total += getTotal(dataArr[j].data);	
			}
			return total;
			case "number":
			return dataArr;
			default:
			throw "error: data invalid";
		}
	};
	
	returnBoxes.push({id:"globalBox",name:"",level:-1,coords:[[0,0],[width,height]],parent:"none",value:getTotal(d)});
	
	recurse = function(d,topLeft,bottomRight,parentID) {
		
		var total, j, k, remainingNodes, startNode,oD,loopCondition,useOverride,currentNode,dByID,loopFunction;
		
		total = getTotal(d);
		dByID={};
		useOverride = false;
		j=0;
		
		//Sort current level by decreasing size
		(function() {
			for (var i=0;i<d.length;i++) {
				d[i].calculatedTotal = getTotal(d[i].data);
			}
			d.sort(function(a,b) {
				return b.calculatedTotal - a.calculatedTotal;
			});
		})();
		
		//Object to save layout parameters
		layoutDef[parentID] = [];
		
		//Object to read layout parameters
		if (layoutOverride) {
			if (layoutOverride[parentID]) {
				useOverride = true;
			}
		}
		if (useOverride) {
			//organize data by ID
			(function() {
				for (var i=0;i<d.length;i++) {
					dByID[d[i].id] = d[i];
				}
			})();
			oD = layoutOverride[parentID];
			loopCondition = (j<oD.length);
		} else {
			loopCondition = (j<d.length);
		}
		
		loopFunction = function () {
			var box,height,width,ratio,subtotal, strip;
			strip = {};
			width = bottomRight[0] - topLeft[0];
			height = bottomRight[1] - topLeft[1];
			strip.total = 0;
			strip.cond = true;
			k=0;
			if (!useOverride) {
				strip.def = {};
				strip.def.boxes = [];
				startNode = j;
				remainingNodes = 0;
			}
			while (strip.cond) {
				if (useOverride) {
					strip.total += dByID[oD[j].boxes[k]].calculatedTotal;
					k++;
					strip.cond = k<oD[j].boxes.length;
				} else {
					strip.total += d[j].calculatedTotal;
					strip.ratio = strip.total/total;
					if (width >= height) {
						strip.def.direction="vertical";
						strip.width = strip.ratio*width;
						strip.height = height;	
					} else {
						strip.def.direction="horizontal";
						strip.width = width;
						strip.height = strip.ratio*height;
					}
					strip.def.boxes.push(d[j].id);
					remainingNodes++;
					j++;
					strip.cond = (Math.max(strip.width/strip.height, strip.height/strip.width) > remainingNodes) && j<d.length;
				}
			}
			if (useOverride) {
				strip.ratio = strip.total/total;
				strip.cond = (oD[j].direction==="vertical");
				if (strip.cond) {
					strip.width = strip.ratio*width;
					strip.height = height;
				} else {
					strip.width = width;
					strip.height = strip.ratio*height;
				}
				remainingNodes = oD[j].boxes.length;
			} else {
				if (strip.width >= strip.height) {strip.def.boxDirection = "horizontal";}
				else {strip.def.boxDirection = "vertical";}
				layoutDef[parentID].push(strip.def);
				strip.cond = (width >= height);
			}
				
			if (strip.cond) {
				strip.topLeft = [topLeft[0],topLeft[1]];
				strip.bottomRight = [topLeft[0] + strip.width,bottomRight[1]];
			} else {
				strip.topLeft = [topLeft[0],topLeft[1]];
				strip.bottomRight = [bottomRight[0],topLeft[1]+strip.height];
			}
			
			for (k=0;k<remainingNodes;k++) {
				if (useOverride) {
					currentNode = dByID[oD[j].boxes[k]];
					strip.def = oD[j];
				} else {currentNode = d[k+startNode];}	
				subtotal = currentNode.calculatedTotal;
				if (strip.total === 0) {ratio = 0;}
				else {ratio = subtotal/strip.total;}
				if (strip.def.boxDirection==="horizontal") {
					box = [ [strip.topLeft[0],strip.topLeft[1]],
							[strip.topLeft[0] + strip.width*ratio,strip.bottomRight[1]]];
					strip.topLeft[0] += strip.width*ratio;
				} else {
					box = [ [strip.topLeft[0],strip.topLeft[1]],
							[strip.bottomRight[0],strip.topLeft[1] + strip.height*ratio]];
					strip.topLeft[1] += strip.height*ratio;
				}
				if (typeof(currentNode.name)==="undefined") {currentNode.name= currentNode.id;}
				returnBoxes.push({id:currentNode.id,coords:box,level:recursionLevel,parent:parentID,name:currentNode.name,value:subtotal});
				if (typeof(currentNode.data) === "object") {
					recursionLevel++;
					recurse(currentNode.data,[box[0][0],box[0][1]],[box[1][0],box[1][1]],currentNode.id);
					recursionLevel--;	
				}
			}
			total -= strip.total;
			if (strip.cond) {
				topLeft[0] += strip.width;	
			} else {
				topLeft[1] += strip.height;
			}
			if (useOverride) {
				j++;
				loopCondition = (j<oD.length);
			} else {
				loopCondition = (j<d.length);
			}
		};
		
		while (loopCondition) {
			loopFunction();
		}
	};
	recurse(d,[0,0],[width,height],"globalBox");
	return {boxes:returnBoxes,layoutDef:layoutDef};
};