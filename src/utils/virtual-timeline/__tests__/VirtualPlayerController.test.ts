import { VirtualPlayerController } from '../VirtualPlayerController'
import { ECGTimelineMapper } from '../ECGTimelineMapper'
import { VirtualTimelineManager } from '../VirtualTimeline'
import type { ClipItem } from '@/app/(route)/editor/types'

describe('VirtualPlayerController', () => {
  let controller: VirtualPlayerController
  let timelineManager: VirtualTimelineManager
  let mapper: ECGTimelineMapper

  beforeEach(() => {
    timelineManager = new VirtualTimelineManager({ debugMode: false })
    mapper = new ECGTimelineMapper(timelineManager)
    controller = new VirtualPlayerController(mapper, { debugMode: false })
  })

  describe('Virtual to Real Time Mapping', () => {
    it('should map virtual time to real time correctly for a single segment', () => {
      const clips: ClipItem[] = [
        {
          id: 'clip1',
          timeline: '0.00-10.00',
          speaker: 'Speaker 1',
          subtitle: 'Test subtitle',
          fullText: 'Test full text',
          duration: '10.00',
          thumbnail: '',
          words: [
            { id: 'w1', text: 'Test', start: 0, end: 5, isEditable: true },
            { id: 'w2', text: 'text', start: 5, end: 10, isEditable: true },
          ],
          stickers: [],
          startTime: 0,
          endTime: 10,
        },
      ]

      mapper.initialize(clips)

      // Test start of segment
      expect(controller.virtualToReal(0)).toBe(0)

      // Test middle of segment
      expect(controller.virtualToReal(5)).toBe(5)

      // Test end of segment
      expect(controller.virtualToReal(10)).toBe(10)
    })

    it('should handle multiple segments with gaps', () => {
      const clips: ClipItem[] = [
        {
          id: 'clip1',
          timeline: '0.00-5.00',
          speaker: 'Speaker 1',
          subtitle: 'First',
          fullText: 'First',
          duration: '5.00',
          thumbnail: '',
          words: [
            { id: 'w1', text: 'First', start: 0, end: 5, isEditable: true },
          ],
          stickers: [],
          startTime: 0,
          endTime: 5,
        },
        {
          id: 'clip2',
          timeline: '10.00-15.00',
          speaker: 'Speaker 2',
          subtitle: 'Second',
          fullText: 'Second',
          duration: '5.00',
          thumbnail: '',
          words: [
            { id: 'w2', text: 'Second', start: 10, end: 15, isEditable: true },
          ],
          stickers: [],
          startTime: 10,
          endTime: 15,
        },
      ]

      mapper.initialize(clips)

      // First segment mapping
      expect(controller.virtualToReal(0)).toBe(0)
      expect(controller.virtualToReal(2.5)).toBe(2.5)
      expect(controller.virtualToReal(5)).toBe(5)

      // Second segment mapping (virtual time continues from 5)
      expect(controller.virtualToReal(5)).toBe(10) // Start of second segment
      expect(controller.virtualToReal(7.5)).toBe(12.5) // Middle of second segment
      expect(controller.virtualToReal(10)).toBe(15) // End of second segment
    })

    it('should return 0 for invalid virtual times', () => {
      const clips: ClipItem[] = []
      mapper.initialize(clips)

      expect(controller.virtualToReal(-1)).toBe(0)
      expect(controller.virtualToReal(100)).toBe(0)
    })
  })

  describe('Seek Operation', () => {
    it('should return promise with real and virtual times', async () => {
      const clips: ClipItem[] = [
        {
          id: 'clip1',
          timeline: '0.00-10.00',
          speaker: 'Speaker 1',
          subtitle: 'Test',
          fullText: 'Test',
          duration: '10.00',
          thumbnail: '',
          words: [
            { id: 'w1', text: 'Test', start: 0, end: 10, isEditable: true },
          ],
          stickers: [],
          startTime: 0,
          endTime: 10,
        },
      ]

      mapper.initialize(clips)

      // Mock video element
      const mockVideo = document.createElement('video')
      controller.attachVideo(mockVideo)

      const result = await controller.seek(5)

      expect(result).toHaveProperty('virtualTime', 5)
      expect(result).toHaveProperty('realTime', 5)
    })

    it('should handle seek queue correctly', async () => {
      const clips: ClipItem[] = [
        {
          id: 'clip1',
          timeline: '0.00-10.00',
          speaker: 'Speaker 1',
          subtitle: 'Test',
          fullText: 'Test',
          duration: '10.00',
          thumbnail: '',
          words: [
            { id: 'w1', text: 'Test', start: 0, end: 10, isEditable: true },
          ],
          stickers: [],
          startTime: 0,
          endTime: 10,
        },
      ]

      mapper.initialize(clips)

      const mockVideo = document.createElement('video')
      controller.attachVideo(mockVideo)

      // Queue multiple seeks
      const seek1 = controller.seek(3)
      const seek2 = controller.seek(5)
      const seek3 = controller.seek(7)

      // First two should be cancelled
      await expect(seek1).rejects.toThrow('Seek cancelled')
      await expect(seek2).rejects.toThrow('Seek cancelled')

      // Last one should succeed
      const result = await seek3
      expect(result.virtualTime).toBe(7)
    })
  })

  describe('getCurrentRealTime', () => {
    it('should return correct real time for current virtual position', () => {
      const clips: ClipItem[] = [
        {
          id: 'clip1',
          timeline: '0.00-10.00',
          speaker: 'Speaker 1',
          subtitle: 'Test',
          fullText: 'Test',
          duration: '10.00',
          thumbnail: '',
          words: [
            { id: 'w1', text: 'Test', start: 0, end: 10, isEditable: true },
          ],
          stickers: [],
          startTime: 0,
          endTime: 10,
        },
      ]

      mapper.initialize(clips)

      const mockVideo = document.createElement('video')
      controller.attachVideo(mockVideo)

      // Set current time and check mapping
      controller.seek(5).then(() => {
        expect(controller.getCurrentRealTime()).toBe(5)
      })
    })
  })

  describe('Boundary Cases', () => {
    it('should handle seek to exact segment boundaries', async () => {
      const clips: ClipItem[] = [
        {
          id: 'clip1',
          timeline: '0.00-5.00',
          speaker: 'Speaker 1',
          subtitle: 'First',
          fullText: 'First',
          duration: '5.00',
          thumbnail: '',
          words: [
            { id: 'w1', text: 'First', start: 0, end: 5, isEditable: true },
          ],
          stickers: [],
          startTime: 0,
          endTime: 5,
        },
        {
          id: 'clip2',
          timeline: '5.00-10.00',
          speaker: 'Speaker 2',
          subtitle: 'Second',
          fullText: 'Second',
          duration: '5.00',
          thumbnail: '',
          words: [
            { id: 'w2', text: 'Second', start: 5, end: 10, isEditable: true },
          ],
          stickers: [],
          startTime: 5,
          endTime: 10,
        },
      ]

      mapper.initialize(clips)

      const mockVideo = document.createElement('video')
      controller.attachVideo(mockVideo)

      // Test boundary seeks
      const result1 = await controller.seek(0)
      expect(result1).toBeDefined()
      expect(result1.realTime).toBe(0)

      const result2 = await controller.seek(5)
      expect(result2).toBeDefined()
      expect(result2.realTime).toBe(5)

      const result3 = await controller.seek(10)
      expect(result3).toBeDefined()
      expect(result3.realTime).toBe(10)
    })

    it('should clamp seeks to valid duration range', async () => {
      const clips: ClipItem[] = [
        {
          id: 'clip1',
          timeline: '0.00-10.00',
          speaker: 'Speaker 1',
          subtitle: 'Test',
          fullText: 'Test',
          duration: '10.00',
          thumbnail: '',
          words: [
            { id: 'w1', text: 'Test', start: 0, end: 10, isEditable: true },
          ],
          stickers: [],
          startTime: 0,
          endTime: 10,
        },
      ]

      mapper.initialize(clips)

      const mockVideo = document.createElement('video')
      controller.attachVideo(mockVideo)

      // Test negative seek
      const result1 = await controller.seek(-5)
      expect(result1).toBeDefined()
      expect(result1.virtualTime).toBe(0)

      // Test beyond duration seek
      const result2 = await controller.seek(100)
      expect(result2).toBeDefined()
      expect(result2.virtualTime).toBe(10)
    })
  })
})
