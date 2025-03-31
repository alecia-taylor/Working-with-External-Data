import * as Carousel from "./Carousel.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// The breed selection input element.
const breedSelect = document.getElementById("breedSelect");
// The information section div element.
const infoDump = document.getElementById("infoDump");
// The progress bar div element.
const progressBar = document.getElementById("progressBar");
// The get favourites button element.
const getFavouritesBtn = document.getElementById("getFavouritesBtn");

// Step 0: Store your API key here for reference and easy access.
const API_KEY = process.env.API_KEY;

const API_URL = "https://api.thecatapi.com/v1";

// Array to hold breed data for later use
let catData = [];

// Show loading indicator while fetching data
function showLoadingState() {
  const loadingElement = document.createElement('div');
  loadingElement.textContent = 'Loading images...';
  infoDump.appendChild(loadingElement);
}

// Hide loading indicator
function hideLoadingState() {
  while (infoDump.firstChild) {
    infoDump.removeChild(infoDump.firstChild);
  }
}

// Update progress bar during Axios requests
function updateProgress(progressEvent) {
  const percentage = (progressEvent.loaded / progressEvent.total) * 100;
  progressBar.style.width = `${percentage}%`;
}

// Axios Interceptors
axios.interceptors.request.use((request) => {
  progressBar.style.width = "0%"; // Reset the progress bar
  document.body.style.cursor = "progress"; // Set cursor to progress
  console.log("Request sent.");
  console.time("Request/Response time"); // Start timer for response
  return request;
});

axios.interceptors.response.use(
  (response) => {
    document.body.style.cursor = ""; // Reset cursor
    console.log("Successful response!");
    console.timeEnd("Request/Response time"); // End timer for response
    return response;
  },
  (error) => {
    document.body.style.cursor = ""; // Reset cursor on error
    console.error("Request failed:", error);
    alert("An error occurred. Please try again later."); // Show error message
    throw error;
  }
);

// Initial load of breed options
async function initialLoad() {
  try {
    const response = await axios.get(API_URL + "/breeds", {
      headers: { "Content-type": "application/json; charset=UTF-8" },
    });

    catData = response.data;

    catData.forEach((breed) => {
      const option = document.createElement("option");
      option.value = breed.id;
      option.textContent = breed.name;
      breedSelect.appendChild(option);
    });

    // Create initial carousel for the first breed
    const firstBreedId = catData[0]?.id;
    if (firstBreedId) {
      loadBreedImages(firstBreedId);
    }
  } catch (error) {
    console.error("Error fetching breed data:", error);
    alert("An error occurred while fetching breed data.");
  }
}

// Fetch and display images for the selected breed
async function loadBreedImages(breedId) {
  try {
    showLoadingState();

    const response = await axios.get(
      API_URL + `/images/search?limit=10&breed_ids=${breedId}`,
      {
        onDownloadProgress: (progressEvent) => {
          updateProgress(progressEvent);
        },
      }
    );
    const jsonData = response.data;
    Carousel.clear();

    if (jsonData.length > 0) {
      jsonData.forEach((image) => {
        const item = Carousel.createCarouselItem(image.url, "cat", image.id);
        Carousel.appendCarousel(item);
      });
    } else {
      const warn = document.createElement("h1");
      warn.style.color = "red";
      warn.textContent = "No images found for this breed.";
      infoDump.appendChild(warn);
    }
    Carousel.start();
    hideLoadingState();

    // Display breed information
    const infoObj = catData.find((item) => item.id === breedId);
    const title = document.createElement("h2");
    title.textContent = infoObj.name;
    const desc = document.createElement("p");
    desc.textContent = infoObj.description;
    infoDump.appendChild(title);
    infoDump.appendChild(desc);
  } catch (error) {
    console.error("Error fetching breed images:", error);
    alert("Error fetching breed images. Please try again.");
    hideLoadingState();
  }
}

// Event listener for breed selection change
breedSelect.addEventListener("change", (e) => {
  const breedId = e.target.value;
  loadBreedImages(breedId);
});

// Axios favorite/unfavorite toggle function
export async function favourite(imgId) {
  const userIDexample = "user-123";

  try {
    const getResponse = await axios.get(
      API_URL + `/favourites?sub_id=${userIDexample}`,
      {
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      }
    );

    const targetObj = getResponse.data.find((obj) => obj.image_id === imgId);

    if (targetObj) {
      // Image is already favorited, delete it
      await axios.delete(API_URL + `/favourites/${targetObj.id}`, {
        headers: { "x-api-key": API_KEY },
      });
    } else {
      // Image is not favorited, add it
      const rawBody = JSON.stringify({
        image_id: imgId,
        sub_id: userIDexample,
      });
      await axios.post(API_URL + "/favourites", rawBody, {
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error favoriting image:", error);
    alert("An error occurred while updating your favorite.");
  }
}

// Fetch and display all favorites
async function getFavourites() {
  const userIDexample = "user-123";

  try {
    const getResponse = await axios.get(
      API_URL + `/favourites?sub_id=${userIDexample}`,
      {
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      }
    );
    const jsonData = getResponse.data;

    Carousel.clear();
    jsonData.forEach((image) => {
      const item = Carousel.createCarouselItem(
        image.image.url,
        "cat",
        image.image.id
      );
      Carousel.appendCarousel(item);
    });
    Carousel.start();
  } catch (error) {
    console.error("Error fetching favorites:", error);
    alert("An error occurred while fetching your favorites.");
  }
}

// Event listener for getting favorites
getFavouritesBtn.addEventListener("click", getFavourites);

// Initial load when the page is loaded
initialLoad();
