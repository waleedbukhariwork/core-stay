enum DiagnosticConfidence {
  guessing('guessing', 'Guessing'),
  somewhatSure('somewhat_sure', 'Somewhat sure'),
  verySure('very_sure', 'Very sure');

  const DiagnosticConfidence(this.value, this.label);
  final String value;
  final String label;
}

class DiagnosticOption {
  DiagnosticOption.fromJson(Map<String, dynamic> json)
    : id = json['id'] as String,
      label = json['label'] as String;
  final String id;
  final String label;
}

class DiagnosticQuestion {
  DiagnosticQuestion.fromJson(Map<String, dynamic> json)
    : id = json['id'] as String,
      category = json['category'] as String,
      interactionType = json['interactionType'] as String,
      skill = (json['skill'] as Map<String, dynamic>)['label'] as String,
      concept = (json['concept'] as Map<String, dynamic>)['label'] as String,
      prompt = json['prompt'] as String,
      context = json['context'] as String?,
      code = json['code'] as String?,
      options = List.unmodifiable(
        (json['options'] as List).map(
          (item) => DiagnosticOption.fromJson(item as Map<String, dynamic>),
        ),
      ),
      confidenceRequested = json['confidenceRequested'] as bool {
    if (interactionType != 'single_choice' ||
        options.length < 2 ||
        options.map((option) => option.id).toSet().length != options.length) {
      throw const FormatException('Unsupported diagnostic question');
    }
  }
  final String id;
  final String category;
  final String interactionType;
  final String skill;
  final String concept;
  final String prompt;
  final String? context;
  final String? code;
  final List<DiagnosticOption> options;
  final bool confidenceRequested;
  String get categoryLabel => switch (category) {
    'scenario_judgment' => 'Scenario judgment',
    'predict_outcome' => 'Predict the outcome',
    'spot_the_bug' => 'Spot the bug',
    'better_approach' => 'Choose a better approach',
    'conceptual_reasoning' => 'Conceptual reasoning',
    _ => 'Engineering diagnostic',
  };
}

class DiagnosticReview {
  DiagnosticReview.fromJson(Map<String, dynamic> json)
    : question = DiagnosticQuestion.fromJson(
        json['question'] as Map<String, dynamic>,
      ),
      selectedOptionId = json['selectedOptionId'] as String,
      correct = json['correct'] as bool,
      correctOptionId = json['correctOptionId'] as String,
      explanation = json['explanation'] as String,
      keyIdea = json['keyIdea'] as String;
  final DiagnosticQuestion question;
  final String selectedOptionId;
  final bool correct;
  final String correctOptionId;
  final String explanation;
  final String keyIdea;
  String get correctAnswer => question.options
      .firstWhere((option) => option.id == correctOptionId)
      .label;
}

class DiagnosticSnapshot {
  DiagnosticSnapshot.fromJson(Map<String, dynamic> json)
    : completed = json['status'] == 'completed',
      answered = (json['progress'] as Map<String, dynamic>)['answered'] as int,
      total = (json['progress'] as Map<String, dynamic>)['total'] as int,
      question = json['question'] == null
          ? null
          : DiagnosticQuestion.fromJson(
              json['question'] as Map<String, dynamic>,
            ),
      confidenceQuestion = json['confidence'] == null
          ? null
          : DiagnosticQuestion.fromJson(
              (json['confidence'] as Map<String, dynamic>)['question']
                  as Map<String, dynamic>,
            ),
      confidenceAnswer = json['confidence'] == null
          ? null
          : (json['confidence'] as Map<String, dynamic>)['selectedOptionId']
                as String,
      review = json['review'] == null
          ? null
          : DiagnosticReview.fromJson(json['review'] as Map<String, dynamic>) {
    if (!['active', 'completed'].contains(json['status']) ||
        total <= 0 ||
        answered < 0 ||
        answered > total ||
        (!completed && question == null && confidenceQuestion == null)) {
      throw const FormatException('Invalid diagnostic progress');
    }
  }
  final bool completed;
  final int answered;
  final int total;
  final DiagnosticQuestion? question;
  final DiagnosticQuestion? confidenceQuestion;
  final String? confidenceAnswer;
  final DiagnosticReview? review;
}

class DiagnosticFailure implements Exception {
  const DiagnosticFailure(this.message);
  final String message;
}
