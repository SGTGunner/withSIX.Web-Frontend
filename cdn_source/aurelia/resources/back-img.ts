import {inject,autoinject,customAttribute,bindingEngine} from 'aurelia-framework';
@inject(Element, W6)
export class BackImgCustomAttribute {
  constructor(private element, private w6: W6) {}

  valueChanged(newValue) {
    this.element.style.backgroundImage = newValue ? 'url(' + newValue + ')' : null;
  }

  getImage = (img: string, updatedAt?): string => {
      if (!img || img == "")
          return this.w6.url.cdn + "/img/noimage.png";
      return img.startsWith("http") || img.startsWith("//") ? img : this.w6.url.getUsercontentUrl(img, updatedAt);
  };
}
