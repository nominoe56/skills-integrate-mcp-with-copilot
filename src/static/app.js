document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");

  // Catégorisation simple des activités (à adapter selon vos besoins)
  function getCategory(name) {
    const sport = ["Soccer Team", "Basketball Team", "Gym Class"];
    const art = ["Art Club", "Drama Club"];
    const science = ["Math Club", "Programming Class"];
    const club = ["Chess Club", "Debate Team"];
    if (sport.includes(name)) return "Sport";
    if (art.includes(name)) return "Art";
    if (science.includes(name)) return "Science";
    if (club.includes(name)) return "Club";
    return "Other";
  }

  let allActivities = {};

  // Fonction pour afficher les activités filtrées/triées
  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = "";
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const sort = sortFilter.value;

    let filtered = Object.entries(allActivities).filter(([name, details]) => {
      const matchesSearch =
        name.toLowerCase().includes(search) ||
        details.description.toLowerCase().includes(search);
      const matchesCategory =
        !category || getCategory(name) === category;
      return matchesSearch && matchesCategory;
    });

    // Tri
    if (sort === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sort === "spots") {
      filtered.sort(
        (a, b) =>
          (b[1].max_participants - b[1].participants.length) -
          (a[1].max_participants - a[1].participants.length)
      );
    }

    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Category:</strong> ${getCategory(name)}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);

      // Ajout à la liste déroulante du formulaire
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Ajout des listeners pour les boutons de suppression
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Fonction pour récupérer les activités depuis l’API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Listeners pour filtres et recherche
  searchInput.addEventListener("input", renderActivities);
  categoryFilter.addEventListener("change", renderActivities);
  sortFilter.addEventListener("change", renderActivities);

  // Initialisation
  fetchActivities();
});
