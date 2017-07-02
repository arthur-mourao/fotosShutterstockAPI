var options = {
  client_id: "c6f6dcab2757686050e9",
  scope: "user.email collections.edit collections.view",
  redirect_endpoint: "index.html",
  success: function (data) { getToken(data); },
};

var oauth = new ShutterstockOAuth(options);

var code;
var token;
var currentAlbum;
var currentAlbumName;

function autentica() {
  oauth.authorize();
}

var getToken = function (data) {
  if (data) {
    code = data["code"];
  }

  $.ajax({
    type: "POST",
    url: 'https://api.shutterstock.com/v2/oauth/access_token',
    data: {
      client_id: "CLIENT_ID",
      grant_type: "authorization_code",
      code: code,
      client_secret: "CLIENT_SECRET",
      realm: "customer"
    },
    dataType: "x-www-form-urlencoded",
    success: function (data) {
      token = JSON.parse(data.responseText).access_token;
      listaMeusAlbuns();
    },
    error: function (data) {
      token = JSON.parse(data.responseText).access_token;
      listaMeusAlbuns();
    }
  });

  $("#botaoAutenticar").hide();
  $("#bodyHidden").show();

};

function listaMeusAlbuns() {
  $.ajax({
    url: 'https://api.shutterstock.com/v2/images/collections',
    headers: {
      Authorization: 'Bearer ' + token
    },
    dataType: "json",
    success: function (data) {
      var strSaida = '';
      var strSaidaUltimosAlbuns = '';
      var imagens = [];

      for (i = 0; i < data.data.length && i < 4; i++) {
        imagens[i] = getImageUrl(data.data[i].cover_item.id, "SMALL");
      }

      for (i = 0; i < data.data.length; i++) {
        strSaida += '<li class="list-group-item"> <a href="#' + data.data[i].id + '" onclick="fotosDoAlbum(this);">' + data.data[i].name + '</a></li>';

        if (i < 4) {
          strSaidaUltimosAlbuns +=
            '<div class="col-sm-6 col-md-3">' +
            '<div class="thumbnail">' +
            '<img src="' + imagens[i] + '" alt="..." style="max-height: 70px;">' +
            '<p><a href="#' + data.data[i].id + '" onclick="fotosDoAlbum(this);">' + data.data[i].name + '</a></p>' +
            '</div>' +
            '</div>';
        }
      }

      $('#meusAlbuns').html(strSaida);
      $('#ultimosAlbuns').html(strSaidaUltimosAlbuns);
    }
  });
}


function executaConsulta() {
  $.ajax({
    url: 'https://api.shutterstock.com/v2/images/search?per_page=50&query=' + $('#query').val(),
    headers: {
      Authorization: 'Bearer ' + token
    },
    dataType: "json",
    success: function (data) {
      var strSaida = '';

      for (i = 0; i < data.data.length; i++) {
        strSaida += '<a href="#' + data.data[i].id + '" class="list-group-item">' +
          '<input type="checkbox" aria-label="..." id="' + data.data[i].id + '">' +
          '<img src=' + data.data[i].assets.small_thumb.url +
          '</a>';
      }

      $('#resultadoPesquisa').html(strSaida);
    }
  });
}


function criaAlbun() {
  if ($('#novoAlbum').val() == '') return;

  var nomeAlbum = $('#novoAlbum').val();
  var dataToSend = { "name": nomeAlbum };

  $.ajax({
    type: "POST",
    url: 'https://api.shutterstock.com/v2/images/collections',
    data: JSON.stringify(dataToSend),
    headers: {
      "Authorization": 'Bearer ' + token,
      "Content-Type": "application/json"
    },
    dataType: "text",
    contentType: "application/json",
    success: function (data) {
      listaMeusAlbuns();
    },
    error: function (data) {
      listaMeusAlbuns();
    }
  });
}

function fotosDoAlbum(elmnt) {
  if (elmnt){
    currentAlbum = elmnt.hash.substring(1);
    currentAlbumName = elmnt.text;
  }
  
  $.ajax({
    url: 'https://api.shutterstock.com/v2/images/collections/' + currentAlbum + '/items',
    headers: {
      Authorization: 'Bearer ' + token
    },
    dataType: "json",
    success: function (data) {
      var strSaida = '';
      var strSaidaSlideShow = '';
      var strSaidaSlideIndex = '';
      var imagens = [];

      for (i = 0; i < data.data.length; i++) {
        imagens[i] = getImageUrl(data.data[i].id, "PREVIEW");
      }

      for (i = 0; i < imagens.length; i++) {
        strSaida +=
          '<div class="col-xs-6 col-md-3">' +
          '<a href="#" class="thumbnail">' +
          '<img src="' + imagens[i] + '" alt="...">' +
          '</a>' +
          '</div>'
          ;
        if (i == 0) {
          strSaidaSlideIndex =
            '<li data-target="#myCarousel" data-slide-to="' + i + '" class="active"></li>';
          strSaidaSlideShow =
            '<div class="item active">' +
            '<img src="' + imagens[i] + '" alt="...">' +
            '</div>';
        }
        else {
          strSaidaSlideIndex +=
            '<li data-target="#myCarousel" data-slide-to="' + i + '"></li>';

          strSaidaSlideShow +=
            '<div class="item">' +
            '<img src="' + imagens[i] + '" alt="...">' +
            '</div>';
        }
      }

      $('#fotosAlbum').html(strSaida);
      $('#slideShowItems').html(strSaidaSlideShow);
      $('#slideShowIndicator').html(strSaidaSlideIndex);
      $('#breadNomeAlbum').text(currentAlbumName);
    },
    error: function (data) {
    }
  });
}

function getImageUrl(id, type) {
  var imagem = JSON.parse($.ajax({
    type: "GET",
    url: "https://api.shutterstock.com/v2/images/" + id,
    headers: {
      Authorization: 'Bearer ' + token
    },
    dataType: "json",
    async: false
  }).responseText);

  if (type == "PREVIEW")
    return imagem.assets.preview.url;
  else if (type == "SMALL")
    return imagem.assets.small_thumb.url;
}

function incluiFotos() {
  //Seletor das imagens selecionadas
  var imagesToInclude = {
    items: []
  };

  $('#resultadoPesquisa  input[type=checkbox]:checked').each(function () {
    imagesToInclude.items.push({ id: this.id });
  });

  $.ajax({
    type: "POST",
    url: 'https://api.shutterstock.com/v2/images/collections/' + currentAlbum + '/items',
    data: JSON.stringify(imagesToInclude),
    headers: {
      "Authorization": 'Bearer ' + token,
      "Content-Type": "application/json"
    },
    dataType: "text",
    contentType: "application/json",
    success: function (data) {
      fotosDoAlbum();
    }
  });
}