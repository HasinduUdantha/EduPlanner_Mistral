export const calculateCompletionPercentage = (planData: {
   plan: {
       days: Array<{
           day: number;
           topics: Array<{
               topic_name: string;
               sub_topics: string[];
           }> | string[];
           activities: string[];
       }>;
   };
   progress: {
       [dayKey: string]: {
           [itemKey: string]: boolean;
       };
   };
}): number => {
   if (!planData || !planData.progress || !planData.plan?.days) return 0;


   let totalItems = 0;
   let completedItems = 0;


   planData.plan.days.forEach((day) => {
       const dayKey = `day_${day.day}`;
       const dayProgress = planData.progress[dayKey] || {};


       day.topics?.forEach((topic, topicIndex) => {
           totalItems++; // Main topic
           if (dayProgress[`topic_${topicIndex}`]) completedItems++;


           if (typeof topic === "object" && Array.isArray(topic.sub_topics)) {
               topic.sub_topics.forEach((_, subIndex) => {
                   totalItems++;
                   const subKey = `subtopic_${topicIndex}_${subIndex}`;
                   if (dayProgress[subKey]) completedItems++;
               });
           }
       });


       day.activities?.forEach((_, activityIndex) => {
           totalItems++;
           if (dayProgress[`activity_${activityIndex}`]) completedItems++;
       });
   });


   if (totalItems === 0) return 0;
   return Math.round((completedItems / totalItems) * 100);
};

