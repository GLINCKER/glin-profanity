# Use Cases Library

Real-world implementation examples for common profanity detection scenarios.

## Table of Contents

- [Social Media & Communities](#social-media--communities)
- [E-Commerce & Marketplaces](#e-commerce--marketplaces)
- [Education & Learning](#education--learning)
- [Gaming](#gaming)
- [Healthcare](#healthcare)
- [Customer Support](#customer-support)
- [Content Platforms](#content-platforms)
- [Enterprise & Business](#enterprise--business)

---

## Social Media & Communities

### 1. Community Forum Moderation

**Scenario:** Moderate user posts and comments in real-time

```typescript
import { Filter } from 'glin-profanity';
import { createSemanticAnalyzer } from 'glin-profanity/ai/semantic';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true
});

const semanticAnalyzer = createSemanticAnalyzer({
  embeddingProvider: /* ... */,
  threshold: 0.6
});

async function moderatePost(post: ForumPost) {
  // Layer 1: Quick profanity check
  const profanityCheck = filter.checkProfanity(post.content);
  
  if (profanityCheck.containsProfanity) {
    return {
      status: 'rejected',
      reason: 'Contains inappropriate language',
      action: 'edit_required'
    };
  }

  // Layer 2: Semantic toxicity check
  const semanticCheck = await semanticAnalyzer.analyze(post.content);
  
  if (semanticCheck.shouldFlag) {
    return {
      status: 'flagged',
      reason: 'Potentially toxic content',
      action: 'manual_review'
    };
  }

  // Layer 3: Auto-approve with monitoring
  await savePost(post);
  
  return {
    status: 'approved',
    postId: post.id
  };
}

// Express endpoint
app.post('/api/posts', async (req, res) => {
  const result = await moderatePost({
    id: crypto.randomUUID(),
    content: req.body.content,
    authorId: req.user.id,
    timestamp: new Date()
  });

  if (result.status === 'rejected') {
    return res.status(400).json({
      error: result.reason,
      suggestion: 'Please remove inappropriate language and try again'
    });
  }

  if (result.status === 'flagged') {
    res.json({
      success: true,
      message: 'Your post is pending review',
      reviewTime: '2-4 hours'
    });
  } else {
    res.json({
      success: true,
      postId: result.postId
    });
  }
});
```

### 2. Real-Time Chat Moderation

**Scenario:** Filter chat messages with WebSocket integration

```typescript
import { Server } from 'socket.io';
import { Filter } from 'glin-profanity';

const filter = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'moderate',
  cacheResults: true
});

const io = new Server(server);

// Track user violations
const violations = new Map<string, number>();

io.on('connection', (socket) => {
  socket.on('chat:message', (message: string) => {
    const userId = socket.data.userId;
    
    // Check profanity
    const result = filter.checkProfanity(message);

    if (result.containsProfanity) {
      // Track violation
      const count = (violations.get(userId) || 0) + 1;
      violations.set(userId, count);

      // Progressive enforcement
      if (count === 1) {
        socket.emit('chat:warning', {
          message: '⚠️ Please keep chat appropriate. Warning 1/3.'
        });
      } else if (count === 2) {
        socket.emit('chat:warning', {
          message: '⚠️ Second warning. Next violation = timeout.'
        });
      } else if (count >= 3) {
        socket.emit('chat:timeout', {
          duration: 3600000,  // 1 hour
          message: '🚫 You have been timed out for 1 hour'
        });
        socket.disconnect();
        return;
      }

      // Don't broadcast inappropriate message
      return;
    }

    // Broadcast clean message
    io.to(socket.data.roomId).emit('chat:message', {
      userId,
      username: socket.data.username,
      message,
      timestamp: Date.now()
    });
  });
});
```

---

## E-Commerce & Marketplaces

### 1. Product Review Moderation

**Scenario:** Moderate customer reviews before publishing

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  excludeWords: ['crap']  // Allow mild criticism
});

interface ProductReview {
  productId: string;
  rating: number;
  title: string;
  content: string;
  authorId: string;
}

async function submitReview(review: ProductReview) {
  // Check title and content
  const titleCheck = filter.checkProfanity(review.title);
  const contentCheck = filter.checkProfanity(review.content);

  const hasProfanity = titleCheck.containsProfanity || contentCheck.containsProfanity;

  if (hasProfanity) {
    // Severe profanity → auto-reject
    const severity = Math.max(
      ...Object.values(titleCheck.severityMap || {}),
      ...Object.values(contentCheck.severityMap || {})
    );

    if (severity > 0.7) {
      return {
        status: 'rejected',
        message: 'Review contains inappropriate language'
      };
    }

    // Mild profanity → manual review
    await db.reviewQueue.create({
      ...review,
      status: 'pending_review',
      reason: 'profanity_detected',
      details: {
        titleProfanity: titleCheck.profaneWords,
        contentProfanity: contentCheck.profaneWords
      }
    });

    return {
      status: 'pending',
      message: 'Your review is being reviewed and will be published within 24 hours'
    };
  }

  // Clean review → auto-publish
  await db.reviews.create({
    ...review,
    status: 'published',
    publishedAt: new Date()
  });

  return {
    status: 'published',
    message: 'Review published successfully'
  };
}
```

### 2. Seller Store Name Validation

**Scenario:** Validate store names before registration

```typescript
async function validateStoreName(storeName: string) {
  // Basic validation
  if (storeName.length < 3 || storeName.length > 50) {
    return {
      valid: false,
      error: 'Store name must be 3-50 characters'
    };
  }

  // Profanity check
  const result = filter.checkProfanity(storeName);

  if (result.containsProfanity) {
    return {
      valid: false,
      error: 'Store name contains inappropriate language',
      suggestion: 'Please choose a professional store name'
    };
  }

  // Check uniqueness
  const exists = await db.stores.findOne({ name: storeName });

  if (exists) {
    return {
      valid: false,
      error: 'Store name already taken'
    };
  }

  return {
    valid: true,
    available: true
  };
}

// Real-time validation endpoint
app.get('/api/validate/store-name', async (req, res) => {
  const { name } = req.query;
  const result = await validateStoreName(name as string);
  res.json(result);
});
```

---

## Education & Learning

### 1. Assignment Submission Check

**Scenario:** Check student submissions for inappropriate content

```typescript
const filter = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'aggressive',  // Strict for educational environment
  normalizeUnicode: true
});

async function submitAssignment(assignment: {
  studentId: string;
  courseId: string;
  title: string;
  content: string;
  attachments: File[];
}) {
  // Check text content
  const titleCheck = filter.checkProfanity(assignment.title);
  const contentCheck = filter.checkProfanity(assignment.content);

  if (titleCheck.containsProfanity || contentCheck.containsProfanity) {
    // Notify student
    await notifyStudent(assignment.studentId, {
      type: 'warning',
      message: 'Your submission contains inappropriate language. Please revise and resubmit.',
      flaggedFields: [
        ...(titleCheck.containsProfanity ? ['title'] : []),
        ...(contentCheck.containsProfanity ? ['content'] : [])
      ]
    });

    // Notify instructor
    await notifyInstructor(assignment.courseId, {
      type: 'inappropriate_submission',
      studentId: assignment.studentId,
      timestamp: new Date()
    });

    return {
      success: false,
      error: 'Submission contains inappropriate content',
      action: 'revise_required'
    };
  }

  // Save clean submission
  await db.assignments.create({
    ...assignment,
    status: 'submitted',
    submittedAt: new Date()
  });

  return {
    success: true,
    message: 'Assignment submitted successfully'
  };
}
```

### 2. Discussion Board Moderation

**Scenario:** Moderate student discussions with educational context

```typescript
const filter = new Filter({
  detectLeetspeak: true,
  context: 'educational',
  excludeWords: ['hell', 'damn']  // Allow in literary context
});

async function postDiscussion(post: {
  courseId: string;
  topicId: string;
  studentId: string;
  content: string;
}) {
  // Check for profanity
  const result = filter.checkProfanity(post.content);

  if (result.containsProfanity) {
    // First offense → warning
    const violations = await db.violations.count({
      studentId: post.studentId,
      type: 'profanity'
    });

    if (violations === 0) {
      await db.violations.create({
        studentId: post.studentId,
        type: 'profanity',
        timestamp: new Date()
      });

      return {
        status: 'warning',
        message: 'Please keep language appropriate. This is your first warning.'
      };
    }

    // Repeat offense → notify instructor
    await notifyInstructor(post.courseId, {
      type: 'repeat_violation',
      studentId: post.studentId,
      violationCount: violations + 1
    });

    return {
      status: 'rejected',
      message: 'Post rejected. Instructor has been notified.'
    };
  }

  // Publish post
  await db.discussions.create(post);

  return {
    status: 'published'
  };
}
```

---

## Gaming

### 1. In-Game Chat Filter

**Scenario:** Filter game chat with gaming-specific exclusions

```typescript
const filter = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'moderate',
  excludeWords: [
    'kill', 'killed', 'killing',  // Game mechanics
    'shot', 'headshot',
    'pwn', 'pwned',
    'noob', 'newbie',
    'camping',
    'spawn'
  ],
  cacheResults: true,
  cacheSize: 10000  // High traffic
});

function processChatMessage(message: {
  playerId: string;
  text: string;
  channel: 'team' | 'all' | 'whisper';
}) {
  const result = filter.checkProfanity(message.text);

  if (result.containsProfanity) {
    // Censor for team/all chat
    if (message.channel !== 'whisper') {
      const censored = filter.censorText(message.text);
      
      return {
        text: censored.processedText,
        censored: true,
        playerId: message.playerId,
        channel: message.channel
      };
    }

    // Allow in whispers but track
    await trackViolation(message.playerId, 'whisper_profanity');
  }

  return {
    text: message.text,
    censored: false,
    playerId: message.playerId,
    channel: message.channel
  };
}
```

### 2. Username Validation

**Scenario:** Validate player usernames during registration

```typescript
async function validateUsername(username: string) {
  // Length check
  if (username.length < 3 || username.length > 20) {
    return { valid: false, error: 'Username must be 3-20 characters' };
  }

  // Alphanumeric check
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Profanity check (strict)
  const result = filter.checkProfanity(username);

  if (result.containsProfanity) {
    return {
      valid: false,
      error: 'Username contains inappropriate language',
      suggestion: 'Choose a family-friendly username'
    };
  }

  // Check availability
  const exists = await db.players.findOne({ username });

  if (exists) {
    return { valid: false, error: 'Username taken' };
  }

  return { valid: true };
}
```

---

## Healthcare

### 1. Patient Portal Messaging

**Scenario:** Filter patient messages with medical terminology exceptions

```typescript
const filter = new Filter({
  detectLeetspeak: true,
  context: 'medical',
  excludeWords: [
    // Medical terms that might trigger false positives
    'breast', 'anal', 'rectal', 'vaginal', 'penis',
    'testicle', 'scrotum', 'anus', 'rectum',
    'mastectomy', 'colonoscopy', 'prostate'
  ]
});

async function sendPatientMessage(message: {
  patientId: string;
  providerId: string;
  subject: string;
  body: string;
}) {
  // Check for inappropriate content
  const subjectCheck = filter.checkProfanity(message.subject);
  const bodyCheck = filter.checkProfanity(message.body);

  if (subjectCheck.containsProfanity || bodyCheck.containsProfanity) {
    return {
      success: false,
      error: 'Message contains inappropriate language',
      action: 'Please revise and resend'
    };
  }

  // Send to provider
  await db.messages.create({
    ...message,
    sentAt: new Date(),
    status: 'delivered'
  });

  return {
    success: true,
    messageId: crypto.randomUUID()
  };
}
```

---

## Customer Support

### 1. Support Ticket Categorization

**Scenario:** Detect angry/abusive tickets for priority routing

```typescript
import { Filter } from 'glin-profanity';
import { createSemanticAnalyzer } from 'glin-profanity/ai/semantic';

const filter = new Filter({ detectLeetspeak: true });
const semanticAnalyzer = createSemanticAnalyzer({ threshold: 0.5 });

async function categorizeTicket(ticket: {
  customerId: string;
  subject: string;
  description: string;
}) {
  // Check for profanity
  const profanityCheck = filter.checkProfanity(ticket.description);
  
  // Check for anger/toxicity
  const semanticCheck = await semanticAnalyzer.analyze(ticket.description);

  let priority = 'normal';
  let category = 'general';
  let escalate = false;

  if (profanityCheck.containsProfanity) {
    // Angry customer → high priority
    priority = 'high';
    category = 'angry_customer';
    escalate = true;

    // Notify senior support
    await notifySeniorSupport({
      ticketId: ticket.customerId,
      reason: 'profanity_detected',
      severity: Math.max(...Object.values(profanityCheck.severityMap || {}))
    });
  } else if (semanticCheck.shouldFlag) {
    // Frustrated customer → medium priority
    priority = 'medium';
    category = 'frustrated_customer';
  }

  await db.tickets.create({
    ...ticket,
    priority,
    category,
    escalated: escalate,
    createdAt: new Date()
  });

  return {
    ticketId: crypto.randomUUID(),
    priority,
    estimatedResponse: priority === 'high' ? '1 hour' : '24 hours'
  };
}
```

---

## Content Platforms

### 1. User-Generated Content Moderation

**Scenario:** YouTube-style comment moderation

```typescript
const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true
});

async function postComment(comment: {
  videoId: string;
  userId: string;
  text: string;
  parentId?: string;  // For replies
}) {
  const result = filter.checkProfanity(comment.text);

  // Auto-moderate based on channel settings
  const channel = await db.channels.findOne({ 
    'videos.id': comment.videoId 
  });

  const moderationLevel = channel.moderationLevel || 'moderate';

  if (result.containsProfanity) {
    switch (moderationLevel) {
      case 'strict':
        // Block comment entirely
        return {
          status: 'rejected',
          message: 'Comment blocked due to inappropriate language'
        };

      case 'moderate':
        // Hold for review
        await db.comments.create({
          ...comment,
          status: 'pending_review',
          flaggedReason: 'profanity',
          createdAt: new Date()
        });

        return {
          status: 'pending',
          message: 'Comment is pending review'
        };

      case 'lenient':
        // Publish but mark as filtered
        await db.comments.create({
          ...comment,
          status: 'published',
          filtered: true,
          showWarning: true
        });

        return {
          status: 'published',
          warning: 'This comment may contain language some find offensive'
        };
    }
  }

  // Clean comment → publish immediately
  await db.comments.create({
    ...comment,
    status: 'published',
    createdAt: new Date()
  });

  return {
    status: 'published',
    commentId: crypto.randomUUID()
  };
}
```

---

## Enterprise & Business

### 1. Internal Communications Filter

**Scenario:** HR-compliant Slack/Teams message filtering

```typescript
const filter = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'aggressive',
  normalizeUnicode: true
});

async function filterWorkplaceMessage(message: {
  channelId: string;
  userId: string;
  text: string;
}) {
  const result = filter.checkProfanity(message.text);

  if (result.containsProfanity) {
    // Log HR violation
    await db.hrViolations.create({
      userId: message.userId,
      type: 'inappropriate_language',
      severity: Math.max(...Object.values(result.severityMap || {})),
      timestamp: new Date(),
      channelId: message.channelId
    });

    // Notify HR if severe
    const severity = Math.max(...Object.values(result.severityMap || {}));
    if (severity > 0.7) {
      await notifyHR({
        userId: message.userId,
        violation: 'severe_profanity',
        context: 'workplace_chat'
      });
    }

    // Prevent message from posting
    return {
      allowed: false,
      reason: 'Message violates workplace conduct policy',
      policy: 'See employee handbook section 3.2'
    };
  }

  return {
    allowed: true
  };
}
```

---

## Implementation Tips

### 1. Choose the Right Configuration

```typescript
const configs = {
  social: { leetspeakLevel: 'moderate', excludeWords: ['damn'] },
  ecommerce: { leetspeakLevel: 'moderate', context: 'business' },
  education: { leetspeakLevel: 'aggressive', normalizeUnicode: true },
  gaming: { excludeWords: ['kill', 'shot', 'noob'] },
  healthcare: { context: 'medical', excludeWords: MEDICAL_TERMS },
  support: { detectLeetspeak: true, semanticAnalysis: true },
  content: { leetspeakLevel: 'moderate', cacheResults: true },
  enterprise: { leetspeakLevel: 'aggressive', logViolations: true }
};
```

### 2. Progressive Enforcement

```typescript
function getEnforcementAction(violationCount: number) {
  if (violationCount === 1) return 'warning';
  if (violationCount === 2) return 'timeout_1h';
  if (violationCount === 3) return 'timeout_24h';
  if (violationCount >= 4) return 'ban';
}
```

### 3. User Feedback

```typescript
function getUserFeedback(result: CheckProfanityResult) {
  if (!result.containsProfanity) return null;

  const severity = Math.max(...Object.values(result.severityMap || {}));

  if (severity > 0.7) {
    return 'Your message contains severe profanity and has been blocked.';
  } else if (severity > 0.4) {
    return 'Your message contains inappropriate language. Please revise.';
  } else {
    return 'Please keep language respectful.';
  }
}
```

---

## Next Steps

- [Best Practices](./best-practices.md) - Production guidelines
- [Examples](./examples.md) - More code examples
- [API Reference](./api-reference.md) - Complete API docs

---

**Choose the use case that matches your needs and adapt the code for your application!** 🚀
