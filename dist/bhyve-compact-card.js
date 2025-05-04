import {LitElement, html, css, nothing} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

class BhyveCompactCard extends LitElement {
  static properties = {
    _config: {state: true}
  };
  
  set hass(hass) {
    this._hass = hass;
  }
    
  updated(changedProperties) {
  }


  setConfig(config) {
    this._config = config;
  }

  static getStubConfig() {
    return {
      device: "abc",
      rain_delay: "sensor.bhyve_rain_delay",
    }
  }

  getCardSize() {
    return 4;
  }

  combinedWateringProgram(switchState) {
     const programs = [
       this.wateringProgram(switchState, 'program_a'),
       this.wateringProgram(switchState, 'program_b'),
       this.wateringProgram(switchState, 'program_c'),
       this.wateringProgram(switchState, 'program_d'),
       this.wateringProgram(switchState, 'program_e')
     ];
     return programs.flat().toSorted();
  }

  nextWatering(program) {
    const now = Date.now();
    for(const watering of program) {
      if(Date.parse(watering) >= now) {
        return watering;
      }
    }
    return null;
  }

  render() {
    if (!this._hass || !this._config) {
      return html``;
    }
    return html`
      <ha-card>
        <div class="card-content">
	  ${this.renderDevice()}
	</div>
      </ha-card>
    `;
  }

  renderRainDelay() {
    if (this._config.rain_delay) {
      const rainDelay = this._hass.states[this._config.rain_delay];
      return html`
	<div style="display:flex;align-items:center;flex-direction:row">
	  <state-badge
	    .hass=${this._hass}
	    .stateObj=${rainDelay}
	      ></state-badge>
	  <div class="info">
	    <span>Rain Delay</span>
	  </div>
	    <ha-entity-toggle class="right" .stateObj="${rainDelay}"></ha-entity-toggle>
	</div>
      `;
    } else {
      return html``;
    }
  }

  renderWatering(switchState, historyState) {
    const lastWateredTime = this._hass.formatEntityState(historyState);
    const lastWateredAmount = historyState.attributes.run_time;
    const nextWateringRaw = this.nextWatering(
	    this.combinedWateringProgram(switchState));
    const nextWatering = nextWateringRaw==null? "Unknown": this._hass.formatEntityState(historyState, nextWateringRaw);
    return html`
          <div class="divider"></div>
          <div style="display:flex;align-items:center;flex-direction:row">
  	      <div class="secondary">${lastWateredTime} for ${lastWateredAmount} min</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge .overrideIcon=${"mdi:update"}></state-badge>
            <div class="info">
              <span>Next Watering</span>
	      <div class="secondary">${nextWatering}</div>
            </div>
          </div>
      `;
  }

  renderDevice() {
    const device = this._config.device ? this._hass.devices[this._config.device] : undefined;
    return html`
      <div style="display:flex;align-items:center;flex-direction:row">
	      <ha-domain-icon .hass=${this._hass} brandFallback="true" .domain="bhyve"></ha-domain-icon>
	      <h1 class="card-header">
	        ${device? (device.name_by_user? device.name_by_user : device.name) : "Smart Watering"}
	      </h1>
      </div>
      ${this.renderRainDelay()}
      ${this.renderWatering(this._hass.states[zone.switch], this._hass.states[zone.history])}
    `;
  }

  static get styles() {
    return css`

      h1 {
        font-size: 24px;
	font-weight: 400;
      }

      .divider {
        height: 1px;
        background-color: var(--entities-divider-color, var(--divider-color)); 
	margin-top: 8px;
	margin-bottom: 8px;
      }

      .info {
        margin-left: 16px;
        margin-right: 8px;
        flex: 1 1 30%;
      }
      .info,
      .info > * {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .secondary {
        color: var(--secondary-text-color);
      }
      .right {
             margin-inline-end: -8px
      }
      .secondary,
      state-badge {
        flex: 0 0 40px;
      }
      .measurement {
          font-size: 18px;
          color: var(--secondary-text-color);
        }
    `;
  }
  
}

customElements.define("bhyve-compact-card", BhyveCompactCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "bhyve-compact-card",
  name: "Orbit B-Hyve Compact Card",
  preview: false,
  description: "Display Compact Orbit B-Hyve Card",
});
