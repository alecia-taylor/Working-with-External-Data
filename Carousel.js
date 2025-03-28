// Export a function to handle adding/removing favorites
export const favourite = async (imageId) => {
    try {
      // Toggle favourite status for the given image ID
      const response = await axios.get(`/favourites?image_id=${imageId}`);
      if (response.data) {
        // If it exists, delete it
        await axios.delete(`/favourites/${response.data.id}`);
        console.log(`Image with ID: ${imageId} unfavourited`);
      } else {
        // If it doesn't exist, add it to favorites
        await axios.post("/favourites", { image_id: imageId });
        console.log(`Image with ID: ${imageId} added to favourites`);
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
    }
  };
  