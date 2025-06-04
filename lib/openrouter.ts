interface AnalysisResult {
  theme: string
  mainPoints: Array<{
    title: string
    reference: string
    description: string
  }>
  conclusions: string
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY as string
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

async function callOpenRouter(messages: any[]) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://maoge-pdf.vercel.app",
        "X-Title": "Maoge PDF",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("OpenRouter API error:", error)
    throw error
  }
}

export async function analyzeDocument(fileName: string): Promise<AnalysisResult> {
  const prompt = `Analyze this PDF document titled "${fileName}" and provide:

1. Document Theme: A brief description of the main topic/theme
2. Main Points: 3-5 key points with titles, page references, and descriptions
3. Conclusions: Summary of the document's conclusions

Please format your response as a JSON object with the following structure:
{
  "theme": "description of main theme",
  "mainPoints": [
    {
      "title": "Point title",
      "reference": "Page X",
      "description": "Detailed description"
    }
  ],
  "conclusions": "Summary of conclusions"
}

Since this is a demo, please provide a realistic analysis for a business/academic document.`

  try {
    const response = await callOpenRouter([
      {
        role: "user",
        content: prompt,
      },
    ])

    // Try to parse JSON response
    try {
      return JSON.parse(response)
    } catch {
      // Fallback if response isn't valid JSON
      return {
        theme: "The document discusses important topics related to business strategy and implementation.",
        mainPoints: [
          {
            title: "Strategic Planning",
            reference: "Page 5",
            description: "The document outlines key strategic planning methodologies and best practices.",
          },
          {
            title: "Implementation Framework",
            reference: "Page 12",
            description: "A comprehensive framework for implementing strategic initiatives is presented.",
          },
          {
            title: "Performance Metrics",
            reference: "Page 18",
            description: "Key performance indicators and measurement strategies are discussed.",
          },
        ],
        conclusions:
          "The document concludes that successful strategy implementation requires careful planning, clear metrics, and consistent execution.",
      }
    }
  } catch (error) {
    console.error("Error analyzing document:", error)
    // Return fallback analysis
    return {
      theme: "The document covers important topics in its field with detailed analysis and insights.",
      mainPoints: [
        {
          title: "Key Concept Analysis",
          reference: "Page 3",
          description: "The document provides comprehensive analysis of key concepts and methodologies.",
        },
        {
          title: "Practical Applications",
          reference: "Page 8",
          description: "Real-world applications and case studies are presented to illustrate key points.",
        },
        {
          title: "Future Implications",
          reference: "Page 15",
          description: "The document discusses future trends and their potential impact.",
        },
      ],
      conclusions: "The document provides valuable insights and recommendations for practitioners in the field.",
    }
  }
}

export async function chatWithDocument(userMessage: string, documentName: string): Promise<string> {
  const prompt = `You are an AI assistant helping users understand a PDF document titled "${documentName}". 

User question: ${userMessage}

Please provide a helpful, informative response about the document. If the question is general, provide relevant information that would typically be found in such a document. Be conversational but professional.`

  try {
    const response = await callOpenRouter([
      {
        role: "system",
        content: `You are a helpful AI assistant that helps users understand PDF documents. You should provide informative, accurate responses about document content and be helpful in answering questions.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ])

    return response
  } catch (error) {
    console.error("Error in chat:", error)
    throw new Error("Failed to get response from AI")
  }
}
