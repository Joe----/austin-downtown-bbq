// data
var locations = [{
        name: 'Bowie BBQ',
        location: {
            lat: 30.2711283,
            lng: -97.7542007
        }
    },
    {
        name: 'Coopers',
        location: {
            lat: 30.264941,
            lng: -97.743626
        }
    },
    {
        name: 'Franklin',
        location: {
            lat: 30.270119,
            lng: -97.731273
        }
    },
    {
        name: 'Green Mesquite',
        location: {
            lat: 30.2615027,
            lng: -97.7591519
        }
    },
    {
        name: 'House Park',
        location: {
            lat: 30.276750,
            lng: -97.750388
        }
    },
    {
        name: 'Iron Works',
        location: {
            lat: 30.262255,
            lng: -97.738995
        }
    },
    {
        name: 'Lamberts',
        location: {
            lat: 30.265155,
            lng: -97.747914
        }
    },
    {
        name: 'Stubbs',
        location: {
            lat: 30.268479,
            lng: -97.736181
        }
    },
    {
        name: 'Terry Blacks',
        location: {
            lat: 30.259692,
            lng: -97.754779
        }
    }
];

// if map doesn't load send alert
function loadError() {
    alert("Sorry, the map didn't load.");
}

// adjust css properties onload depending on window size
checkSize();

// when window is resized, check it and make css changes
$(window).resize(checkSize);

// hide toggle button and show filter list for larger screens
function checkSize(){
  if ($(window).width() > 479){
    $("#btn").css("display","none");
    $("#filter").css("display","block");
  } else {
    $("#btn").css("display","block");
    $("#filter").css("display","none");
  }
}

// toggle the filter input and list then add aria-expanded for accessibility
$("#btn").click(function(){
    $("div#filter").toggle();
    if ( $("#btn").attr('aria-expanded') == 'true' ) {
        $("#btn").attr("aria-expanded","false");
    } else {
        $("#btn").attr("aria-expanded","true");
    }
});

// view model
var ViewModel = function() {
    var self = this;

    // searchbox is binded to search input
    this.searchbox = ko.observable('');

    // array to hold the markers
    this.markerlist = ko.observableArray([]);

    // add markers for each location
    locations.forEach(function(location) {
        self.markerlist.push(new Place(location));
    });

    // filter the placelist bound to <ul>
    this.placelist = ko.computed(function() {
        var searchFilter = self.searchbox().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.markerlist(), function(location) {
                var str = location.title.toLowerCase();
                var result;
                if (str.indexOf(searchFilter) !== -1) {
                  result = true;
                }
                location.visible(result);
                return result;
            });
        }
        self.markerlist().forEach(function(location) {
            location.visible(true);
        });
        return self.markerlist();
    }, self);
};

// create place objects
var Place = function(data) {
    var self = this;
    self.title = data.name;
    self.position = data.location;
    self.street = '',
    self.city = '',
    self.phone = '';
    self.visible = ko.observable(true);

    // foursquare required params
    var clientID = 'BWXUZE0DHCCAFVWMBL2QWHFBHPL5NJAUQ30TXMMSU33SSDMQ';
    var clientSecret = 'XP2ZHEGCAZ5WF5BDWF2HGP3N0LKAXRLPROUIIUL4HHP550YE';

    // Foursquare data call
    var url = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20171231' + '&query=' + this.title + '&limit=1';
    $.ajax({
        url: url,
        success: function(data) {
            // get specific data from json response and handle if there is none
            self.street = data.response.venues[0].location.formattedAddress[0] ? data.response.venues[0].location.formattedAddress[0] : '';
            self.city = data.response.venues[0].location.formattedAddress[1] ? data.response.venues[0].location.formattedAddress[1] : '';
            self.phone = data.response.venues[0].contact.formattedPhone ? data.response.venues[0].contact.formattedPhone : '';
            self.checkins = data.response.venues[0].stats.checkinsCount ? data.response.venues[0].stats.checkinsCount : '';
            self.users = data.response.venues[0].stats.usersCount ? data.response.venues[0].stats.usersCount : '';
            self.url = data.response.venues[0].url ? data.response.venues[0].url : '#';
        },
        // handle if foursquare call does not work
        error: function() {
            alert('Sorry, data from FourSquare did not load');
        }
    });

    // create markers
    self.marker = new google.maps.Marker({
        title: self.title,
        position: this.position,
        animation: google.maps.Animation.DROP,
        icon: 'img/bbq.png',
    });

    // set markers based on seachbox filtering that toggles visibility
    self.filtermarkers = ko.computed(function() {
        if (self.visible() === true) {
            self.marker.setMap(map);
        } else {
            self.marker.setMap(null);
        }
    });

    // open and populate infowindows on click
    self.marker.addListener('click', function() {
        populateInfoWindow(this, self.street, self.city, self.phone, self.checkins, self.users, self.url, infoWindow);
        toggleBounce(this);
        map.panTo(this.getPosition());
    });

    // trigger a click to open the infowindow when a list item is clicked
    self.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };
};

// Populate the infowindow when marker click is triggered
function populateInfoWindow(marker, street, city, phone, checkins, users, url, infowindow) {
    // make sure the infowindow is not open
    if (infowindow.marker != marker) {

        infowindow.marker = marker;

        // set marker to null when closed with x, or else you can't reopen it
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        // build the infowindow content
        var infoWindowContent = "<h2>" + marker.title + "</h2>" +
            "<p><strong>FOURSQUARE Info:</strong>" +
            "<br>" + street +
            "<br>" + city +
            "<br>" + phone +
            "<br><a href=" + url + " target='_blank'>Visit website</a>" +
            "<br>Checkins: " + checkins.toLocaleString() + " Users: " + users.toLocaleString() +
            "</p>";

        infowindow.setContent(infoWindowContent);

        // Open infowindow
        infowindow.open(map, marker);
    }
}

// bounce the markers but control the bounce time
function toggleBounce(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 700);
}

// initialize map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 30.269280,
            lng: -97.742836
        },
        zoom: 15,
        mapTypeControl: false
    });
    infoWindow = new google.maps.InfoWindow();
    ko.applyBindings(new ViewModel());
}
