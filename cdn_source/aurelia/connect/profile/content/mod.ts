import {ContentViewModel, IContent} from './base';

export class Mod extends ContentViewModel<IContent> {
  icon = "withSIX-icon-Nav-Mod";
  changelog() {
    alert("TODO");
  }
}
