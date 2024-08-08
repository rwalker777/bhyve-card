import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

class BhyveZoneCard extends LitElement {
  static properties = {
    _switchId: {state: true},
    _switchState: {state: true},
    _historyId: {state: true},
    _historyState: {state: true},
    _config: {state: true}
};
  
  set hass(hass) {
    this._hass = hass;
    this._switchState = hass.states[this._switchId];
    this._historyState = hass.states[this._historyId];
  }
    
  updated(changedProperties) {
  }


  setConfig(config) {
    if (!config.switch) {
      throw new Error("You need to define a switch entity");
    }
    if (!config.history) {
      throw new Error("You need to define a history entity");
    }
    this._config = config;
    this._switchId = this._config.switch;
    this._historyId = this._config.history;
  }

  static getStubConfig() {
    return {
      switch: "switch.none_zone_2",
      history: "sensor.unknown_zone_history_2"
    }
  }

  getCardSize() {
    return 4;
  }

  wateringProgram(programName) {
    if(!(programName in this._switchState.attributes)) {
      return [];
    }
    if(!this._switchState.attributes[programName].enabled) {
      return [];
    }
   return this._switchState.attributes[programName].watering_program;
  }

  combinedWateringProgram() {
     const programs = [
       this.wateringProgram('program_a'),
       this.wateringProgram('program_b'),
       this.wateringProgram('program_c'),
       this.wateringProgram('program_d'),
       this.wateringProgram('program_e')
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
    const lastWateredTime = this._hass.formatEntityState(this._historyState);
    const lastWateredAmount = this._historyState.attributes.run_time;
    const smartWateringEnabled = this._switchState.attributes.smart_watering_enabled;
    const nextWateringRaw = this.nextWatering(
	    this.combinedWateringProgram());
    const nextWatering = nextWateringRaw==null? "Unknown": this._hass.formatEntityState(this._historyState, nextWateringRaw);
    return html`
      <ha-card>
        <div class="card-content">
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge
              .hass=${this._hass}
              .stateObj=${this._switchState}
		></state-badge>
            <div class="info text-content">
              <span>${this._switchState.attributes.friendly_name}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge overrideIcon="mdi:water-pump"></state-badge>
            <div class="info text-content">
              <span>Water now</span>
            </div>
	    <ha-entity-toggle class="right" .stateObj="${this._switchState}"></ha-entity-toggle>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge overrideIcon="mdi:auto-mode"></state-badge>
            <div class="info text-content">
              <span>Smart Watering</span>
            </div>
	    <ha-switch class="right" .checked="${smartWateringEnabled}" disabled="true"></ha-entity-toggle>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge overrideIcon="mdi:history"></state-badge>
            <div class="info text-content">
              <span>Last Watering</span>
	      <div class="secondary">${lastWateredTime} for ${lastWateredAmount} min</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;flex-direction:row">
            <state-badge overrideIcon="mdi:update"></state-badge>
            <div class="info text-content">
              <span>Next Watering</span>
	      <div class="secondary">${nextWatering}</div>
            </div>
          </div>
        </div>
      </ha-card>
      `;
  }

  static get styles() {
    return css`
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

customElements.define("bhyve-zone-card", BhyveZoneCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "bhyve-zone-card",
  name: "Orbit B-Hyve Zone Card",
  preview: false,
  description: "Display Orbit B-Hyve Card for a single Zone",
});
