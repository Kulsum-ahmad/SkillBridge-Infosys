// backend/controllers/aiController.js
import stringSimilarity from 'string-similarity';

// ✅ THE FIX: Use 'import' AND add the '.js' extension at the end
import Opportunity from '../models/opportunity.model.js'; 
import User from '../models/User.js'; 

export const getAIRecommendations = async (req, res) => {
    try {
        // 1. Fetch the logged-in volunteer's profile
        // Assuming your auth middleware adds the user ID to req.user
        const volunteer = await User.findById(req.user.id);
        
        if (!volunteer || !volunteer.skills) {
            return res.status(400).json({ message: "Please add skills to your profile to enable AI matching." });
        }

        // 2. Fetch all active NGO opportunities
        const opportunities = await Opportunity.find(); 

        // 3. The AI Matching Logic (Vector space comparison)
        const recommendations = opportunities.map(opp => {
            const volunteerSkills = volunteer.skills.toLowerCase();
            
            // Combine NGO requirement fields for a richer comparison
            // Adjust 'skillsRequired' and 'description' to match your actual database fields
            const ngoRequirements = `${opp.skillsRequired || ''} ${opp.title} ${opp.description || ''}`.toLowerCase();

            // Calculate similarity (uses Dice's Coefficient under the hood)
            const score = stringSimilarity.compareTwoStrings(volunteerSkills, ngoRequirements);

            return {
                ...opp._doc,
                matchScore: Math.round(score * 100) // Convert 0.854 to 85
            };
        });

        // 4. Filter out weak matches, sort highest to lowest, and take the top 4
        const sortedRecs = recommendations
            .filter(rec => rec.matchScore > 10) // Only keep matches over 10%
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 4);

        res.status(200).json(sortedRecs);

    } catch (error) {
        console.error("AI Engine Error:", error);
        res.status(500).json({ message: "Server error generating AI recommendations." });
    }
};