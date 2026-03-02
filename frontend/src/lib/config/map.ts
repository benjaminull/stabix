import { MAPBOX_TOKEN } from './constants';

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export const MAP_CONFIG = {
  style: MAPBOX_STYLE,
  accessToken: MAPBOX_TOKEN,
  antialias: true,
  attributionControl: false,
  logoPosition: 'bottom-right' as const,
};

export const CLUSTER_CONFIG = {
  clusterMaxZoom: 14,
  clusterRadius: 50,
  clusterProperties: {
    sum: ['+', ['get', 'count']],
  },
};

export const MARKER_COLORS = {
  default: '#FF8C42',
  selected: '#FFD166',
  cluster: '#0D213B',
};

export function getClusterColor(pointCount: number): string {
  return pointCount > 100
    ? '#FF8C42'
    : pointCount > 50
      ? '#FFD166'
      : pointCount > 10
        ? '#FFA07A'
        : '#FFE699';
}
