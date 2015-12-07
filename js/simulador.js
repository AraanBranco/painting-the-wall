var simulador = (function () {

	"use strict";

	var canvas,
	context,
	canvasHeight,
	width = 685,
	height = 490,
	imagemOriginal,
	telaAreaCor,
	telaAreaCorImg  = new Image,
	telaAreaCorXML,
	corRgb,
	corSelecionada = 'transparent'

	,consoleLog = function( txt ){
		console.log( txt );
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

	,excluirArea = function(){

	}

	,pintaArea = function (){

		telaAreaCor = document.getElementById("telaAreaCor");

		telaAreaCorImg.onload = function(){
			context.drawImage( telaAreaCorImg, 0, 0, telaAreaCorImg.width, telaAreaCorImg.height );
		};

		telaAreaCorXML = (new XMLSerializer).serializeToString( telaAreaCor );
		telaAreaCorImg.src = 'data:image/svg+xml,' + encodeURIComponent( telaAreaCorXML );
	}

	,init = function () {

		canvas = document.getElementById('canvas');
		context = canvas.getContext('2d');


		imagemOriginal = document.getElementById("imagemOriginal");

		context.drawImage(imagemOriginal, 0, 0, width, height);
		pintaArea();
		events();
	};

	return {
		init: init
	};
}());
