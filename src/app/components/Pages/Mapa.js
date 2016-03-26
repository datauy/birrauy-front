import React from "react";
import Layout from "../Base/Layout";
import Banner from "../Base/Banner";
import Filters from "../Base/Filters";
import { GoogleMap, Marker } from "react-google-maps";
import Relay from "../../../utils/Relay.js";
import {
  DEFAULT_LOCATION,
  IMAGES_URL,
  BREWERY_TYPES,
  BREWERY_IMG_MAP
} from "../../../../config/app.js";

const TYPES_MAP = {
  "tiendas": [
    "Tienda"
  ],
  "bares": [
    "Brewpub",
    "Restaurant",
    "Bar"
  ],
  "productores": [
    "Cervecería",
    "Marca"
  ]
};

class Mapa extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      activeBreweryId: null
    };
  }
  render () {
    var breweries = this.props.breweries
      , venues = this.props.venues
      , activeBreweryId = this.state.activeBreweryId
      , activeTypes = TYPES_MAP[this.props.location.query.t]
      , activeBrewery = null
      , breweryPhoto = null
      , containerProps = null
      , markers = null;

    containerProps = {
      style: {
        height: "100%"
      }
    };

    if (breweries.get("status") === "loading" ||
        venues.get("status") === "loading") {

      return (<div>Loading</div>);
    }

    breweries = breweries.get("data")
      .map((b) => b.update("id", (id) => ("brewery-" + id)))
      .concat(
        venues.get("data")
          .map((b) => b.update("id", (id) => ("venue-" + id)))
      );

    if (activeBreweryId) {
      activeBrewery = breweries.find((brewery) => {
        return brewery.get("id") === activeBreweryId;
      });

      if (activeBrewery.get("photo_suffix")) {
        breweryPhoto = (
          <Banner.Img src={activeBrewery.get("photo_prefix") + "height50" + activeBrewery.get("photo_suffix")} />
        );
      }

      activeBrewery = (
        <Layout.Banner>
          <Banner>
            {breweryPhoto}
            <Banner.Title>{activeBrewery.get("name")}</Banner.Title>
            <Banner.Description>
              {activeBrewery.get("address")}
            </Banner.Description>
          </Banner>
        </Layout.Banner>
      );
    }
    else {
      activeBrewery = (
        <Layout.Banner>
          <Banner>
            <Filters>
              <Filters.Item to="/" query={{ t: "tiendas" }}>
                Tiendas
              </Filters.Item>
              <Filters.Item to="/" query={{ t: "bares" }}>
                Bares
              </Filters.Item>
              <Filters.Item to="/" query={{ t: "productores" }}>
                Productores
              </Filters.Item>
            </Filters>
          </Banner>
        </Layout.Banner>
      );
    }

    markers = breweries
      .filter((brewery) => {
        const type = brewery.get("brewery_type") || brewery.get("venue_type");

        return brewery.get("lat") && brewery.get("lng") &&
          BREWERY_TYPES.indexOf(type) !== -1 &&
          (!activeTypes || activeTypes.indexOf(type) !== -1);
      })
      .map((brewery) => {
        var isActive = brewery.get("id") === activeBreweryId
          , type = brewery.get("brewery_type") || brewery.get("venue_type")
          , imgKey = BREWERY_IMG_MAP[type]
          , position = null
          , icon = null;

        if (isActive) {
          imgKey += "-active";
        }

        position = {
          lat: parseFloat(brewery.get("lat")),
          lng: parseFloat(brewery.get("lng"))
        };
        icon = {
          url: (IMAGES_URL + imgKey + ".png"),
          scaledSize: {
            width: 34,
            height: 45
          }
        };

        return (
          <Marker key={brewery.get("id")}
                  position={position}
                  defaultAnimation={2}
                  icon={icon}
                  onClick={this._selectMarkerHandler(brewery.get("id"))} />
        );
      })
      .toJS();

    return (
      <Layout.Content withBanner={!!activeBrewery}>
        <GoogleMap containerProps={containerProps}
                   defaultCenter={DEFAULT_LOCATION}
                   defaultZoom={14}>
          {markers}
        </GoogleMap>
        {activeBrewery}
      </Layout.Content>
    );
  }
  _selectMarkerHandler (breweryId) {
    return () => {
      this.setState({ activeBreweryId: breweryId });
    };
  }
}

Mapa.propTypes = {
  breweries: React.PropTypes.object.isRequired,
  venues: React.PropTypes.object.isRequired
};

export default Relay.createContainer(Mapa, {
  queries: {
    breweries: {
      info: function (params, request) {
        return {
          id: "/breweries"
        };
      }
    },
    venues: {
      info: function (params, request) {
        return {
          id: "/venues"
        };
      }
    }
  }
});
