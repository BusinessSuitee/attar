const fs = require('fs');

// Read files
const homePage = fs.readFileSync('D:/alatar/alatar-angular/src/app/pages/home/home.page.html', 'utf8');
const stationsHtml = fs.readFileSync('D:/alatar/stations.html', 'utf8');
const galleryHtml = fs.readFileSync('D:/alatar/gallery.html', 'utf8');
const contactHtml = fs.readFileSync('D:/alatar/contact.html', 'utf8');

// 1. Extract from stations.html: "???? ??????" up to the end of workflow
const mhaIdx = stationsHtml.indexOf('<h2 class="text-3xl font-bold text-slate-900 dark:text-slate-100">???? ??????</h2>');
const startStations = stationsHtml.lastIndexOf('<section', mhaIdx);
const endStations = stationsHtml.indexOf('</main>', startStations);
const sectionStations = stationsHtml.substring(startStations, endStations);

// 2. Extract from gallery.html: "???? ?????" & "????????"
const galleryTitleIdx = galleryHtml.indexOf('<h2>???? ?????</h2>');
// Let's find the start of the <section id="gallery"> or similar
const startGallery = galleryHtml.indexOf('<section id="images"');
// Or maybe galleryHtml has both images and videos.
let startGal = galleryHtml.indexOf('<section class="py-12 bg-white');
if (startGal === -1) startGal = galleryHtml.indexOf('<section', galleryHtml.indexOf('<main>'));
const endGallery = galleryHtml.indexOf('</main>', startGal);
const sectionGallery = galleryHtml.substring(startGal, endGallery);

// 3. Extract from contact.html: contact block
const startContact = contactHtml.indexOf('<section class="py-16');
const endContact = contactHtml.indexOf('</main>', startContact);
const sectionContact = contactHtml.substring(startContact, endContact);

console.log("Stations length:", sectionStations.length);
console.log("Gallery length:", sectionGallery.length);
console.log("Contact length:", sectionContact.length);

const targetStart = homePage.indexOf('<section id="stations"');
const targetEnd = homePage.indexOf('</main>', targetStart);

const newContent = homePage.substring(0, targetStart) + sectionStations + sectionGallery + sectionContact + '\n</main>';

fs.writeFileSync('D:/alatar/alatar-angular/src/app/pages/home/home.page.html', newContent, 'utf8');
