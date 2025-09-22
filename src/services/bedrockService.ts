import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

export interface BedrockConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export interface ClaudeRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  stopSequences?: string[]
}

export interface ClaudeResponse {
  completion: string
  stop_reason: string
}

class BedrockService {
  private client: BedrockRuntimeClient

  constructor(config: BedrockConfig) {
    this.client = new BedrockRuntimeClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async invokeClaude(request: ClaudeRequest): Promise<ClaudeResponse> {
    try {
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: request.maxTokens || 1000,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.7,
      }

      const command = new InvokeModelCommand({
        modelId: 'us.anthropic.claude-3-5-haiku-20241022-v1:0', // Inference Profile 사용
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      })

      const response = await this.client.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))

      return {
        completion: responseBody.content[0].text,
        stop_reason: responseBody.stop_reason,
      }
    } catch (error) {
      console.error('Bedrock API 호출 실패:', error)
      throw new Error(`Bedrock 서비스 오류: ${error}`)
    }
  }

  async invokeClaudeHaiku(request: ClaudeRequest): Promise<ClaudeResponse> {
    const payload = {
      prompt: `\n\nHuman: ${request.prompt}\n\nAssistant:`,
      max_tokens_to_sample: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
      stop_sequences: request.stopSequences || ['\n\nHuman:'],
    }

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    })

    const response = await this.client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    return {
      completion: responseBody.completion,
      stop_reason: responseBody.stop_reason,
    }
  }
}

export default BedrockService
