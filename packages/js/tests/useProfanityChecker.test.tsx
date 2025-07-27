// Mock React and testing library for Node environment
const mockReact = {
  useState: jest.fn(),
  useCallback: jest.fn(),
};

const mockRenderHook = jest.fn();
const mockAct = jest.fn();

// Override imports
jest.mock('react', () => mockReact);
jest.mock('@testing-library/react', () => ({
  renderHook: mockRenderHook,
  act: mockAct,
}));
import { useProfanityChecker } from '../src/hooks/useProfanityChecker';
import { SeverityLevel } from '../src/types/types';

// Mock the core functions to ensure we're testing the hook behavior
jest.mock('../src/core', () => ({
  checkProfanity: jest.fn(),
  checkProfanityAsync: jest.fn(),
  isWordProfane: jest.fn(),
}));

import { checkProfanity, checkProfanityAsync, isWordProfane } from '../src/core';

const mockCheckProfanity = checkProfanity as jest.MockedFunction<typeof checkProfanity>;
const mockCheckProfanityAsync = checkProfanityAsync as jest.MockedFunction<typeof checkProfanityAsync>;
const mockIsWordProfane = isWordProfane as jest.MockedFunction<typeof isWordProfane>;

describe('useProfanityChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    test('initializes with null result', () => {
      const { result } = renderHook(() => useProfanityChecker());
      
      expect(result.current.result).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });

    test('provides all expected methods', () => {
      const { result } = renderHook(() => useProfanityChecker());
      
      expect(typeof result.current.checkText).toBe('function');
      expect(typeof result.current.checkTextAsync).toBe('function');
      expect(typeof result.current.isWordProfane).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('checkText functionality', () => {
    test('calls core checkProfanity and updates state', () => {
      const mockResult = {
        containsProfanity: true,
        profaneWords: ['damn'],
        filteredWords: ['damn'],
        autoReplaced: 'This is a *** test',
        processedText: 'This is a *** test'
      };
      
      mockCheckProfanity.mockReturnValue(mockResult);
      
      const { result } = renderHook(() => useProfanityChecker());
      
      act(() => {
        const checkResult = result.current.checkText('This is a damn test');
        expect(checkResult).toEqual(mockResult);
      });

      expect(mockCheckProfanity).toHaveBeenCalledWith('This is a damn test', undefined);
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.isDirty).toBe(true);
    });

    test('passes configuration to core function', () => {
      const config = { 
        languages: ['english'], 
        autoReplace: true, 
        replaceWith: '***' 
      };
      
      mockCheckProfanity.mockReturnValue({
        containsProfanity: false,
        profaneWords: [],
        filteredWords: [],
        autoReplaced: 'clean text'
      });
      
      const { result } = renderHook(() => useProfanityChecker(config));
      
      act(() => {
        result.current.checkText('clean text');
      });

      expect(mockCheckProfanity).toHaveBeenCalledWith('clean text', config);
    });
  });

  describe('checkTextAsync functionality', () => {
    test('calls core checkProfanityAsync and updates state', async () => {
      const mockResult = {
        containsProfanity: true,
        profaneWords: ['damn'],
        filteredWords: ['damn'],
        autoReplaced: 'This is a *** test'
      };
      
      mockCheckProfanityAsync.mockResolvedValue(mockResult);
      
      const { result } = renderHook(() => useProfanityChecker());
      
      await act(async () => {
        const checkResult = await result.current.checkTextAsync('This is a damn test');
        expect(checkResult).toEqual(mockResult);
      });

      expect(mockCheckProfanityAsync).toHaveBeenCalledWith('This is a damn test', undefined);
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('isWordProfane functionality', () => {
    test('calls core isWordProfane', () => {
      mockIsWordProfane.mockReturnValue(true);
      
      const { result } = renderHook(() => useProfanityChecker());
      
      act(() => {
        const isProfane = result.current.isWordProfane('damn');
        expect(isProfane).toBe(true);
      });

      expect(mockIsWordProfane).toHaveBeenCalledWith('damn', undefined);
    });

    test('passes configuration to core isWordProfane', () => {
      const config = { customWords: ['badword'] };
      mockIsWordProfane.mockReturnValue(true);
      
      const { result } = renderHook(() => useProfanityChecker(config));
      
      act(() => {
        result.current.isWordProfane('badword');
      });

      expect(mockIsWordProfane).toHaveBeenCalledWith('badword', config);
    });
  });

  describe('reset functionality', () => {
    test('resets result to null', () => {
      const mockResult = {
        containsProfanity: true,
        profaneWords: ['damn'],
        filteredWords: ['damn'],
        autoReplaced: 'This is a *** test'
      };
      
      mockCheckProfanity.mockReturnValue(mockResult);
      
      const { result } = renderHook(() => useProfanityChecker());
      
      // First set a result
      act(() => {
        result.current.checkText('This is a damn test');
      });
      
      expect(result.current.result).toEqual(mockResult);
      expect(result.current.isDirty).toBe(true);
      
      // Then reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.result).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Configuration Changes', () => {
    test('recreates callbacks when config changes', () => {
      const { result, rerender } = renderHook(
        ({ config }) => useProfanityChecker(config),
        { initialProps: { config: { languages: ['english'] } } }
      );
      
      const originalCheckText = result.current.checkText;
      
      rerender({ config: { languages: ['spanish'] } });
      
      // Callbacks should be different due to config change
      expect(result.current.checkText).not.toBe(originalCheckText);
    });
  });

  describe('Custom Actions', () => {
    test('custom actions are called through core function', () => {
      const customAction = jest.fn();
      const config = { customActions: customAction };
      
      const mockResult = {
        containsProfanity: true,
        profaneWords: ['damn'],
        filteredWords: ['damn'],
        autoReplaced: 'This is a *** test'
      };
      
      mockCheckProfanity.mockReturnValue(mockResult);
      
      const { result } = renderHook(() => useProfanityChecker(config));
      
      act(() => {
        result.current.checkText('This is a damn test');
      });

      // Custom action should be called through the core function
      expect(mockCheckProfanity).toHaveBeenCalledWith('This is a damn test', config);
    });
  });
});