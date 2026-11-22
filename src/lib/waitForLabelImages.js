// A missing image must fail visibly, never leave label printing waiting forever.
export default function waitForLabelImages(images) {
  return Promise.all(Array.from(images, image => new Promise((resolve, reject) => {
    if (image.complete && image.naturalWidth > 0) return resolve();
    let timer;
    const finish = (error) => {
      window.clearTimeout(timer);
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
      if (error) reject(error);
      else resolve();
    };
    const loaded = () => finish();
    const failed = () => finish(new Error('A label image could not load. Please try printing again.'));
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', failed, { once: true });
    timer = window.setTimeout(() => finish(new Error('A label image took too long to load. Please try printing again.')), 10000);
    if (image.complete) failed();
  })));
}