import {LitElement, html, css, nothing} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

class BhyveCard extends LitElement {
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
      battery_level: "sensor.bhyve_battery_level",
      rain_delay: "sensor.bhyve_rain_delay",
      smart_program: "switch.smart_watering_program",
      programs: ["switch.bhyve_program_n"],
      zones: [{
	switch: "switch.zone_n",
	history: "sensor.zone_history_n"
      }]
    }
  }

  getCardSize() {
    return 4;
  }

  wateringProgram(switchState, programName) {
    if(!(programName in switchState.attributes)) {
      return [];
    }
    if(!switchState.attributes[programName].enabled) {
      return [];
    }
   return switchState.attributes[programName].watering_program;
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
	  ${this.renderPrograms()}
	  ${this.renderZones()}
	</div>
      </ha-card>
    `;
  }

  renderBatteryLevel() {
    if (this._config.battery_level) {
      const batteryLevel = this._hass.states[this._config.battery_level];
      const batteryLevelFormatted = this._hass.formatEntityState(batteryLevel);
      return html`
	<div style="display:flex;align-items:center;flex-direction:row">
	  <state-badge
	    .hass=${this._hass}
	    .stateObj=${batteryLevel}
	      ></state-badge>
	  <div class="info">
	    <span>Battery Level</span>
	  </div>
	  <div class="right">
	    ${batteryLevelFormatted}
	  </div>
	</div>
	    `;
    } else {
      return html``;
    }
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

  renderDevice() {
    const device = this._config.device ? this._hass.devices[this._config.device] : undefined;
    return html`
      <div style="display:flex;align-items:center;flex-direction:row">
	<ha-domain-icon .hass=${this._hass} brandFallback="true" .domain="bhyve"></ha-domain-icon>
	<h1 class="card-header">
	  ${device? (device.name_by_user? device.name_by_user : device.name) : "Smart Watering"}
	</h1>
      </div>
      ${this.renderBatteryLevel()}
      ${this.renderRainDelay()}
    `;
  }

  renderPrograms() {
    if (this._config.programs) {
      return html`
	<div style="display:flex;align-items:center;flex-direction:row">
	  <div class="info">
	    <div class="secondary">Programs</div>
	  </div>
	</div>
	${this._config.programs.map(prog => this.renderProgram(this._hass.states[prog]))}
	  `;
    } else {
      return html``;
    }
  }
  renderProgram(programState) {
    return html`
      <div style="display:flex;align-items:center;flex-direction:row">
	<state-badge
	  .hass=${this._hass}
	  .stateObj=${programState}
	    ></state-badge>
	<div class="info">
	  <span>${programState.attributes.friendly_name}</span>
	</div>
	<ha-entity-toggle class="right" .stateObj="${programState}"></ha-entity-toggle>
      </div>
    `;
  }

  renderZones() {
    if (this._config.zones) {
      return html`
	<div style="display:flex;align-items:center;flex-direction:row">
	  <div class="info">
	    <div class="secondary">Zones</div>
	  </div>
	</div>
	${this._config.zones.map(zone => this.renderZone(this._hass.states[zone.switch], this._hass.states[zone.history]))}
	  `;
    } else {
      return html``;
    }
  }

  renderZone(switchState, historyState) {
    const lastWateredTime = this._hass.formatEntityState(historyState);
    const lastWateredAmount = historyState.attributes.run_time;
    const smartWateringEnabled = switchState.attributes.smart_watering_enabled;
    const nextWateringRaw = this.nextWatering(
	    this.combinedWateringProgram(switchState));
    const nextWatering = nextWateringRaw==null? "Unknown": this._hass.formatEntityState(historyState, nextWateringRaw);
    return html`
          <div class="divider"></div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge
              .hass=${this._hass}
              .stateObj=${switchState}
		></state-badge>
            <div class="info">
              <span>${switchState.attributes.friendly_name}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge .overrideIcon=${"mdi:water-pump"}></state-badge>
            <div class="info">
              <span>Water now</span>
            </div>
	    <ha-entity-toggle class="right" .stateObj="${switchState}"></ha-entity-toggle>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge .overrideIcon=${"mdi:auto-mode"}></state-badge>
            <div class="info">
              <span>Smart Watering</span>
            </div>
	    <ha-switch class="right" .checked="${smartWateringEnabled}" disabled="true"></ha-entity-toggle>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge .overrideIcon=${"mdi:history"}></state-badge>
            <div class="info">
              <span>Last Watering</span>
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

customElements.define("bhyve-card", BhyveCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "bhyve-card",
  name: "Orbit B-Hyve Card",
  preview: false,
  description: "Display Orbit B-Hyve Card",
});
