/**
 * FAQ Section Accordion Functionality
 * Handles opening/closing FAQ items with smooth animations
 */

class FAQAccordion {
  constructor(container) {
    this.container = container;
    this.questions = container.querySelectorAll('.faq-question');
    this.answers = container.querySelectorAll('.faq-answer');
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupAccessibility();
  }

  bindEvents() {
    this.questions.forEach(question => {
      question.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleItem(question);
      });

      // Keyboard navigation
      question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleItem(question);
        }
      });
    });
  }

  setupAccessibility() {
    this.questions.forEach(question => {
      const answerId = question.getAttribute('aria-controls');
      const answer = this.container.querySelector(`#${answerId}`);

      if (answer) {
        // Ensure proper ARIA relationships
        question.setAttribute('aria-expanded', question.getAttribute('aria-expanded') || 'false');
        answer.setAttribute('aria-hidden', answer.getAttribute('aria-hidden') || 'true');
      }
    });
  }

  toggleItem(clickedQuestion) {
    const isCurrentlyExpanded = clickedQuestion.getAttribute('aria-expanded') === 'true';
    const answerId = clickedQuestion.getAttribute('aria-controls');
    const answer = this.container.querySelector(`#${answerId}`);

    if (!answer) return;

    // Close all other items first
    this.closeAllItems();

    // Toggle the clicked item
    if (!isCurrentlyExpanded) {
      this.openItem(clickedQuestion, answer);
    }
  }

  openItem(question, answer) {
    // Set ARIA attributes
    question.setAttribute('aria-expanded', 'true');
    answer.setAttribute('aria-hidden', 'false');

    // Add expanded class for styling
    question.closest('.faq-item').setAttribute('aria-expanded', 'true');

    // Smooth height animation
    this.animateHeight(answer, true);
  }

  closeAllItems() {
    this.questions.forEach(question => {
      const answerId = question.getAttribute('aria-controls');
      const answer = this.container.querySelector(`#${answerId}`);

      if (answer && question.getAttribute('aria-expanded') === 'true') {
        this.closeItem(question, answer);
      }
    });
  }

  closeItem(question, answer) {
    // Set ARIA attributes
    question.setAttribute('aria-expanded', 'false');
    answer.setAttribute('aria-hidden', 'true');

    // Remove expanded class
    question.closest('.faq-item').setAttribute('aria-expanded', 'false');

    // Smooth height animation
    this.animateHeight(answer, false);
  }

  animateHeight(element, isOpening) {
    if (isOpening) {
      // Get the natural height
      const naturalHeight = element.scrollHeight;

      // Set initial height to 0
      element.style.maxHeight = '0px';

      // Force reflow
      element.offsetHeight;

      // Animate to natural height
      element.style.maxHeight = naturalHeight + 'px';

      // Clean up after animation
      setTimeout(() => {
        element.style.maxHeight = 'none';
      }, 300);
    } else {
      // Get current height
      const currentHeight = element.scrollHeight;

      // Set to current height
      element.style.maxHeight = currentHeight + 'px';

      // Force reflow
      element.offsetHeight;

      // Animate to 0
      element.style.maxHeight = '0px';
    }
  }

  // Public method to open a specific item by index
  openItemByIndex(index) {
    if (index >= 0 && index < this.questions.length) {
      const question = this.questions[index];
      const answerId = question.getAttribute('aria-controls');
      const answer = this.container.querySelector(`#${answerId}`);

      if (answer) {
        this.closeAllItems();
        this.openItem(question, answer);
      }
    }
  }

  // Public method to close all items
  closeAll() {
    this.closeAllItems();
  }
}

// Initialize FAQ accordions when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const faqSections = document.querySelectorAll('.faq-section');

  faqSections.forEach(section => {
    new FAQAccordion(section);
  });
});

// Re-initialize when new sections are added dynamically (for theme editor)
if (typeof Shopify !== 'undefined' && Shopify.designMode) {
  document.addEventListener('shopify:section:load', function(event) {
    const section = event.target.querySelector('.faq-section');
    if (section) {
      new FAQAccordion(section);
    }
  });
}
