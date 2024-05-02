/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Retool } from '@tryretool/custom-component-support'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import React from 'react'
import './style.css'

export const MapboxDraggableMarkers: React.FC = () => {
  const map = React.useRef<mapboxgl.Map>(null)
  const mapContainer = React.useRef<HTMLDivElement>(null)

  const [isMapLoaded, setIsMapLoaded] = React.useState(false)

  const retoolOnDragEnd = Retool.useEventCallback({
    name: 'on-drag-end'
  })

  const retoolOnViewportChanged = Retool.useEventCallback({
    name: 'on-viewport-changed'
  })

  const retoolOnRotateEnd = Retool.useEventCallback({
    name: 'on-rotate-end'
  })

  const [accessToken, _setAccessToken] = Retool.useStateString({
    name: 'accessToken',
    description:
      'Mapbox access token. You can get one at https://account.mapbox.com/access-tokens/create. \
\
 *Example* \
`pk.eyJ1...`',
    label: 'Access Token'
  });

  const [longitude, setLongitude] = Retool.useStateString({
    name: 'longitude',
    description:
      'Default longitude of the map \
\
 *Example* \
`-122.4376`',
    initialValue: '-122.4376',
    label: 'Longitude'
  })
  const [latitude, setLatitude] = Retool.useStateString({
    name: 'latitude',
    description:
      'Default latitude of the map \
\
 *Example* \
`37.7577`',
    initialValue: '37.7577',
    label: 'Latitude'
  })
  const [points, setPoints] = Retool.useStateArray({
    name: 'points',
    description:
      "An array of points to render. They must have the keys specified in the longitude column name and latitude column name. \
\
 *Example* \
`{{[{ longitude: '-122.4194', latitude: '37.7949' },]}}`",
    initialValue: [
      { longitude: '-122.4194', latitude: '37.7949' },
      { longitude: '-122.4794', latitude: '37.7749' },
      { longitude: '-122.4194', latitude: '37.7049' }
    ],
    label: 'Points'
  })
  const [latitudeFieldName, _setLatitudeFieldName] = Retool.useStateString({
    name: 'latitudeFieldName',
    description:
      'The name of the field containing latitude data \
\
 *Example* \
`latitude`',
    initialValue: 'latitude',
    label: 'Latitude field name'
  })
  const [longitudeFieldName, _setLongitudeFieldName] = Retool.useStateString({
    name: 'longitudeFieldName',
    description:
      'The name of the field containing longitude data \
\
 *Example* \
`longitude`',
    initialValue: 'longitude',
    label: 'Longitude field name'
  })
  const [geoJSON, _setGeoJSON] = Retool.useStateObject({
    name: 'geoJSON',
    description:
      'A GeoJSON object to show on the map. Expects appropriate features for a mapbox fill layer, such as polygons and linestrings. Check out geojson.org for more info!',
    initialValue: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                ['-122.454', '37.766'],
                ['-122.51', '37.764'],
                ['-122.51', '37.772'],
                ['-122.455', '37.773']
              ]
            ]
          }
        }
      ]
    },
    label: 'GeoJSON'
  })
  const [zoom, setZoom] = Retool.useStateNumber({
    name: 'zoom',
    description:
      'The name of the field containing zoom data \
      \
       *Example* \
      `9`',
    initialValue: 9,
    label: 'Zoom'
  })
  const [mapStyle, _setMapStyle] = Retool.useStateString({
    name: 'mapStyle',
    initialValue: 'mapbox://styles/mapbox/light-v11',
    label: 'Style'
  })
  const [viewport, _setViewport] = Retool.useStateObject({
    name: 'viewport',
    description:
      'The current viewport of the map. Contains the longitude, latitude, and zoom level of the map. \
\
  *Example* \
`{ longitude: -122.4376, latitude: 37.7577, zoom: 9 }`',
    label: 'Viewport',
    inspector: 'hidden'
  })
  const [markers, setMarkers] = React.useState<mapboxgl.Marker[]>([])

  Retool.useComponentSettings({
    defaultWidth: 4,
    defaultHeight: 30
  })

  React.useEffect(() => {
    if (accessToken.trim() !== '') {
      mapboxgl.accessToken = accessToken;
    } else {
      console.warn('No Mapbox Access Token provided. Please provide one in the component settings.');
      return;
    }

    if (map.current) return // initialize map only once

    // @ts-ignore
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: mapStyle,
      center: [parseFloat(longitude), parseFloat(latitude)],
      zoom: zoom,
      attributionControl: false
    })

    if (geoJSON !== undefined) {
      map.current.on('load', () => {
        map.current!.addSource('geojson-polygon', {
          type: 'geojson',
          // @ts-ignore
          data: geoJSON as unknown as FeatureCollection
        })

        map.current!.addLayer({
          id: 'geojson-polygon-layer',
          type: 'fill',
          source: 'geojson-polygon',
          layout: {},
          paint: {
            'fill-color': '#0080ff', // blue color fill
            'fill-opacity': 0.5
          }
        })

        setIsMapLoaded(true)
      })
    }

    map.current.on('render', () => {
      map.current!.resize()
    })

    map.current.on('moveend', () => {
      const center = map.current!.getCenter()
      setLongitude(center.lng.toFixed(6))
      setLatitude(center.lat.toFixed(6))
      setZoom(map.current!.getZoom())

      _setViewport({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.current!.getZoom()
      })

      retoolOnViewportChanged()
    })

    map.current.on('rotateend', () => {
      const center = map.current!.getCenter()
      setLongitude(center.lng.toFixed(6))
      setLatitude(center.lat.toFixed(6))
      setZoom(map.current!.getZoom())

      _setViewport({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.current!.getZoom()
      })

      retoolOnRotateEnd()
    })
  }, [mapContainer.current, accessToken])

  React.useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return
    }

    if (geoJSON !== undefined) {
      map.current
        .getSource('geojson-polygon')
        // @ts-ignore
        .setData(geoJSON as unknown as FeatureCollection)
    }
  }, [geoJSON])

  React.useEffect(() => {
    if (!map.current) {
      return
    }

    map.current.setStyle(mapStyle)
  }, [mapStyle])

  React.useEffect(() => {
    if (!map.current) {
      return
    }

    for (const marker of markers) {
      marker.remove()
    }

    const list: mapboxgl.Marker[] = []
    let index = 0
    for (const point of points) {
      const el = document.createElement('div')
      const width = 24
      const height = 48
      el.className = `marker-${index}`
      el.style.backgroundImage = `url('https://cyboticx.retool.com/api/file/f86d27e9-4312-4c1f-8539-713bcf0097be')`
      el.style.width = `${width}px`
      el.style.height = `${height}px`
      el.style.backgroundSize = '100%'
      el.style.backgroundRepeat = 'no-repeat'

      const marker = new mapboxgl.Marker(el)
        .setLngLat([
          // @ts-ignore
          parseFloat(point[longitudeFieldName]),
          // @ts-ignore
          parseFloat(point[latitudeFieldName])
        ])
        .setDraggable(true)
        .addTo(map.current)

      marker.on('dragend', onDragEnd)

      list.push(marker)

      index++
    }

    setMarkers(list)
  }, [map.current, points])

  React.useEffect(() => {
    if (!map.current) {
      return
    }

    _setViewport({
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude),
      zoom: zoom
    })

    map.current.setCenter([parseFloat(longitude), parseFloat(latitude)])
  }, [longitude, latitude])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragEnd = (event: any) => {
    const element = event.target._element as HTMLDivElement
    for (const classElement of element.classList.values()) {
      if (classElement.startsWith('marker-')) {
        const newPoints = [...points]
        newPoints[parseInt(classElement.replace('marker-', ''))] = {
          [longitudeFieldName]: event.target._lngLat.lng,
          [latitudeFieldName]: event.target._lngLat.lat
        }

        setPoints(newPoints)

        retoolOnDragEnd()
      }
    }
  }

  return (
    <div className="main-container">
      <div ref={mapContainer} className="map-container" />
    </div>
  )
}
