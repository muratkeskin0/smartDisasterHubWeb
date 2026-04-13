import { Component, OnInit, OnDestroy, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button';
import { TextAnalysisService } from '../../../core/services/text-analysis.service';
import { TranslocoPipe } from '@jsverse/transloco';

// Declare Leaflet types
declare var L: any;

// Local interface for map markers with lat/lng for Leaflet
interface MapMarker {
  lat: number;
  lng: number;
  count: number;
  posts: Array<{
    id: number;
    title: string;
    url: string;
    contentPreview?: string | null;
    locationText?: string | null;
  }>;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RouterModule, AppHeaderComponent, BackButtonComponent, TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  mapOptions: any = {
    /** Turkey-centered view (approx. country mid), country-wide visibility */
    center: [39.0, 35.0] as [number, number],
    zoom: 6,
    minZoom: 3,
    maxZoom: 18
  };

  map: any = null;
  markers: any[] = [];
  currentZoom: number = 6;
  /** Full marker set from API (never replaced by zoom filter) */
  allMarkersData: MapMarker[] = [];
  visibleMarkers: MapMarker[] = [];
  mapInitialized: boolean = false;
  loading: boolean = true;
  error: string | null = null;
  /** Marker cluster selected by click — show posts in side panel */
  selectedMarker: MapMarker | null = null;

  constructor(private textAnalysisService: TextAnalysisService) {}

  ngOnInit(): void {
    this.loadMapMarkers();
  }

  loadMapMarkers(): void {
    this.loading = true;
    this.error = null;
    
    this.textAnalysisService.getMapMarkers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Convert backend MapMarker (latitude/longitude) to local MapMarker (lat/lng)
          this.allMarkersData = response.data
            .filter(
              m =>
                m.latitude != null &&
                m.longitude != null &&
                !Number.isNaN(Number(m.latitude)) &&
                !Number.isNaN(Number(m.longitude))
            )
            .map(marker => ({
              lat: marker.latitude as number,
              lng: marker.longitude as number,
              count: marker.count,
              posts: marker.posts.map(post => ({
                id: post.id,
                title: post.title,
                url: post.url,
                contentPreview: post.contentPreview ?? null,
                locationText: post.locationText ?? null
              }))
            }));
          this.applyZoomFilter();
          this.scheduleMapResize();
        }
        this.loading = false;
        this.scheduleMapResize();
      },
      error: (err) => {
        console.error('Error loading map markers:', err);
        this.error = 'Failed to load map data';
        this.loading = false;
        // Fallback to empty array
        this.allMarkersData = [];
        this.visibleMarkers = [];
      }
    });
  }

  ngAfterViewInit(): void {
    // Wait a bit for the view to be ready
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
  }

  initMap(): void {
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.warn('Leaflet is not loaded. Please install: npm install leaflet @types/leaflet');
      return;
    }

    try {
      // Initialize map
      this.map = L.map('map', {
        center: [39.0, 35.0],
        zoom: 6,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: true
      });

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Handle zoom events
      this.map.on('zoomend', () => {
        this.currentZoom = this.map.getZoom();
        this.updateVisibleMarkers();
        this.updateMapMarkers();
      });

      // Initial zoom value
      this.currentZoom = this.map.getZoom();

      // Add markers
      this.updateMapMarkers();
      this.mapInitialized = true;
      this.scheduleMapResize();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  /** Leaflet measures container on init; flex/layout can be wrong until after paint — refresh tile layout. */
  private scheduleMapResize(): void {
    const run = () => {
      if (this.map && typeof this.map.invalidateSize === 'function') {
        this.map.invalidateSize({ animate: false });
      }
    };
    setTimeout(run, 0);
    setTimeout(run, 200);
  }

  /**
   * Derive {@link visibleMarkers} from {@link allMarkersData}.
   * (Previously we hid pins at low zoom unless count≥3 — that hid every single-post location.)
   */
  applyZoomFilter(): void {
    this.visibleMarkers = [...this.allMarkersData];

    if (this.mapInitialized) {
      this.updateMapMarkers();
    }
  }

  updateVisibleMarkers(): void {
    this.applyZoomFilter();
  }

  onMapReady(map: any): void {
    this.map = map;
    this.map.on('zoomend', () => {
      this.currentZoom = this.map.getZoom();
      this.updateVisibleMarkers();
      this.updateMapMarkers();
    });
    this.updateMapMarkers();
  }

  updateMapMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => {
      if (marker && marker.remove) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];

    // Add markers for visible locations
    this.visibleMarkers.forEach((markerData) => {
      const marker = this.createMarker(markerData);
      if (marker) {
        this.markers.push(marker);
        marker.addTo(this.map);
      }
    });
  }

  createMarker(markerData: MapMarker): any {
    if (typeof L === 'undefined') return null;

    // Create custom HTML for circular marker with count
    const size = this.getMarkerSize(markerData.count);
    const markerHtml = `
      <div class="custom-leaflet-marker" style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: #0d9488;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${size < 35 ? '12px' : size < 45 ? '14px' : '16px'};
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${markerData.count}
      </div>
    `;

    // Create custom icon
    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'custom-marker-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });

    // Create marker
    const marker = L.marker([markerData.lat, markerData.lng], {
      icon: customIcon
    });

    // Create popup with post information
    let popupContent = `<div style="min-width: 200px;">`;
    popupContent += `<strong>${markerData.count} ${markerData.count === 1 ? 'post' : 'posts'}</strong><br>`;
    popupContent += `<small>${markerData.lat.toFixed(4)}, ${markerData.lng.toFixed(4)}</small><br><br>`;
    
    markerData.posts.slice(0, 3).forEach((post, index) => {
      popupContent += `<div style="margin: 8px 0; padding: 8px; border-left: 3px solid #0d9488; background: #f8fafc;">`;
      popupContent += `<a href="${post.url}" target="_blank" style="color: #0f766e; text-decoration: none; font-weight: 500;">${post.title}</a>`;
      popupContent += `</div>`;
    });
    
    if (markerData.posts.length > 3) {
      popupContent += `<div style="margin-top: 8px; color: #6b7280; font-size: 12px;">+${markerData.posts.length - 3} more posts</div>`;
    }
    
    popupContent += `</div>`;
    
    // Bind popup but don't auto-open on click
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup',
      closeOnClick: false,
      autoClose: false,
      closeOnEscapeKey: true
    });

    let closePopupTimeout: any = null;

    // Show popup on hover (mouseover)
    marker.on('mouseover', () => {
      if (closePopupTimeout) {
        clearTimeout(closePopupTimeout);
        closePopupTimeout = null;
      }
      marker.openPopup();
      
      // Add event listeners to popup after it's opened
      marker.once('popupopen', () => {
        const popupElement = marker.getPopup().getElement();
        if (popupElement) {
          // Keep popup open when mouse is over popup
          popupElement.addEventListener('mouseenter', () => {
            if (closePopupTimeout) {
              clearTimeout(closePopupTimeout);
              closePopupTimeout = null;
            }
          });
          
          // Close popup when mouse leaves popup
          popupElement.addEventListener('mouseleave', () => {
            closePopupTimeout = setTimeout(() => {
              marker.closePopup();
            }, 100);
          });
        }
      });
    });

    // Hide popup when mouse leaves marker area (with delay to allow moving to popup)
    marker.on('mouseout', () => {
      closePopupTimeout = setTimeout(() => {
        marker.closePopup();
        closePopupTimeout = null;
      }, 200);
    });

    marker.on('click', () => {
      if (closePopupTimeout) {
        clearTimeout(closePopupTimeout);
        closePopupTimeout = null;
      }
      marker.closePopup();
      this.selectedMarker = markerData;
      this.scheduleMapResize();
    });

    return marker;
  }

  onMarkerClick(markerData: MapMarker, postIndex: number = 0): void {
    const post = markerData.posts[postIndex];
    if (post?.url) {
      this.openPostOnReddit(post.url);
    }
  }

  closePostPanel(): void {
    this.selectedMarker = null;
    this.scheduleMapResize();
  }

  openPostOnReddit(url: string): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  getMarkerSize(count: number): number {
    // Calculate marker size based on post count
    // Minimum size: 30px, Maximum size: 60px
    const minSize = 30;
    const maxSize = 60;
    
    if (this.allMarkersData.length === 0) return minSize;

    const maxCount = Math.max(...this.allMarkersData.map(m => m.count));
    
    if (maxCount <= 0) return minSize;

    return minSize + (count / maxCount) * (maxSize - minSize);
  }
}





