var simulador = (function () {

	"use strict";

	var canvas_teste, context_teste,
	canvasMascara, contextMascara,
	canvas, context,
	width = 685,
	height = 490,
	imagemOriginal,
	telaAreaCor,
	telaAreaCorImg  = new Image,
	telaAreaCorXML,
	corRgb,
	corSelecionada = 'transparent',
	mascara = new Kinetic.Layer(),
	polygonsArea = new Kinetic.Layer()

	,consoleLog = function( txt ){
		console.log( txt );
	}

	,calculaPolygons = function(){
		var poly = document.querySelectorAll('#telaAreaCor polygon');

		if (poly && poly.length){

			for (var ex = 0; ex < poly.length; ex++){

				var p = poly[ex];

				var polPoints = String( p.attributes['points'].value ).split(',');

				var polygon = new Kinetic.Polygon({
					points: polPoints,
					fill: '#660000',
					strokeWidth: 0
				});

				if( typeof p.attributes['data-excludent'] != 'undefined' && p.attributes['data-excludent'].value == '1'){
					polygon.infoCor = 'nao-cor';
				}

				polygonsArea.add( polygon );
			}
		}

		desenha();
	}

	,calculaAreaPolygon = function (polygon){
		var rect = [999999, 999999, 0, 0];

		if (polygon){
			var points = [];

			if (polygon.getPoints){
				points = polygon.getPoints();
			}else
			{
				var tmpPoints = String(polygon.getAttribute('points')).split(',');

				for (var p = 0; p < tmpPoints.length; p += 2){
					points.push({
						x : tmpPoints[p + 0],
						y : tmpPoints[p + 1]
					});
				}
			}

			if (points.length > 0){
				for (var i = 0; i < points.length; i++)
				{
					var x = points[i].x;
					var y = points[i].y;

					rect[0] = Math.min(rect[0], x);
					rect[1] = Math.min(rect[1], y);
					rect[2] = Math.max(rect[2], x);
					rect[3] = Math.max(rect[3], y);
				}

				rect[2] -= rect[0];
				rect[3] -= rect[1];
			}
		}

		return rect;
	}

	,desenha = function (){

		var polygons = polygonsArea.children;

		for (var i = 0; i < polygons.length; i++){
			var polygon = polygons[i];

			var area = calculaAreaPolygon(polygon);
			var contextPolygon = polygon.getLayer().getContext();


			var imagemData = context.getImageData(area[0], area[1], area[2], area[3]);
			var polygonData = contextPolygon.getImageData(area[0], area[1], area[2], area[3]);
			var mascaraData = contextMascara.getImageData(area[0], area[1], area[2], area[3]);

			var tmpData  = context_teste.createImageData( polygonData );

			for (var d = 0; d < tmpData.data.length; d += 4){

				var imagemRGB = {
					r: imagemData.data[d + 0],
					g: imagemData.data[d + 1],
					b: imagemData.data[d + 2],
					a: imagemData.data[d + 3]
				};

				var polygonRGB = {
					r: polygonData.data[d + 0],
					g: polygonData.data[d + 1],
					b: polygonData.data[d + 2],
					a: polygonData.data[d + 3]
				};

				var mascaraRGB = {
					r: mascaraData.data[d + 0],
					g: mascaraData.data[d + 1],
					b: mascaraData.data[d + 2],
					a: mascaraData.data[d + 3]
				};


				var polygonAlpha  = polygonRGB.a / 255;
				var mascaraAlpha  = mascaraRGB.a / 255;


				if ( /^nao-cor$/i.test(polygon.infoCor) ){

					tmpData.data[d + 0] = imagemRGB.r; // R
					tmpData.data[d + 1] = imagemRGB.g; // G
					tmpData.data[d + 2] = imagemRGB.b; // B

					if (polygonRGB.r == 255 && polygonRGB.g == 255 && polygonRGB.b == 255 && /^nao-cor$/i.test(polygon.infoCor)){
						tmpData.data[d + 3] = 255 - polygonRGB.a; // A
					}else{
						tmpData.data[d + 3] = imagemRGB.a; // A
					}

				}else{
					tmpData.data[d + 0] = mascaraRGB.r; // R
					tmpData.data[d + 1] = mascaraRGB.g; // G
					tmpData.data[d + 2] = mascaraRGB.b; // B
					tmpData.data[d + 3] = mascaraRGB.a; // A
				}


			}

			context_teste.putImageData(tmpData, area[0], area[1]);

		}

	}

	,events = function(){

		var cores =  document.querySelectorAll("#cores ul li")
		for (var i = 0; i < cores.length; i++) {
			cores[i].addEventListener("click", function(){
				corSelecionada = this.attributes['data-cor'].value;
				consoleLog("Cor selecionada: "+ corSelecionada);
			});
		}

		var polygons =  document.querySelectorAll("#telaAreaCor polygon");
		for (var i = 0; i < polygons.length; i++) {
			polygons[i].addEventListener("click", function(){

				// if( typeof this.attributes['data-excludent'] != 'undefined'  this.attributes['data-excludent'].value != 1 ){

				if(typeof this.attributes['data-titulo'] != 'undefined' ){
					this.attributes['data-titulo'].value = "";
				}

				if(typeof this.attributes['data-codigo'] != 'undefined' ){
					this.attributes['data-codigo'].value = "";
				}

				if(typeof this.attributes['data-cor'] != 'undefined' ){
					this.attributes['data-cor'].value = "";
				}

				if(typeof this.attributes['style'] != 'undefined' ){
					consoleLog("Pintou : "+ corSelecionada);
					this.attributes['style'].value = 'fill: '+corSelecionada;
				}
				// }
			});
		}

	}

	,init = function () {

		imagemOriginal = document.getElementById("imagemOriginal");

		canvas_teste = document.getElementById('canvas');
		context_teste = canvas_teste.getContext('2d');
		context_teste.drawImage(imagemOriginal, 0, 0, width, height);

		canvas = document.getElementById('canvas-imagem');
		context = canvas.getContext('2d');
		context.drawImage(imagemOriginal, 0, 0, width, height);


		canvasMascara = document.getElementById('canvas-mascara');
		contextMascara = canvasMascara.getContext('2d');
		//SVG
		telaAreaCor = document.getElementById("telaAreaCor");
		telaAreaCorXML = (new XMLSerializer).serializeToString( telaAreaCor );
		telaAreaCorImg.src = 'data:image/svg+xml,' + encodeURIComponent( telaAreaCorXML );
		telaAreaCorImg.onload = function(){
			contextMascara.drawImage( telaAreaCorImg, 0, 0, telaAreaCorImg.width, telaAreaCorImg.height );
			calculaPolygons();
		};

	};

	return {
		init: init
	};
}());
