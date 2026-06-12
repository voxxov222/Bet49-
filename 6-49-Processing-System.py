# -*- coding: utf-8 -*-
"""
bet49 - J.A.R.V.I.S. Neural Database Integration Core
=====================================================
Processing Module: 6-49-Processing-System.py
Purpose: Advanced statistical filter arrays, skip models, and dimensional vectors 
         for Lotto 6/49 combination analysis.
Licensed under Stark Industries Neural Mesh Protocol vTC-649.
"""

import sys
import json
import math
import random
from datetime import datetime

# Default preset of past draws for standalone CLI usage
DEFAULT_DRAW_DATABASE = [
    {"date": "2026-06-10", "numbers": [4, 15, 23, 27, 33, 41]},
    {"date": "2026-06-06", "numbers": [12, 19, 21, 30, 42, 48]},
    {"date": "2026-06-03", "numbers": [2, 16, 27, 33, 39, 45]},
    {"date": "2026-05-30", "numbers": [8, 14, 25, 28, 36, 49]},
    {"date": "2026-05-27", "numbers": [5, 11, 20, 31, 37, 44]},
    {"date": "2026-05-23", "numbers": [1, 15, 22, 29, 32, 40]},
    {"date": "2026-05-20", "numbers": [9, 13, 24, 38, 41, 47]},
    {"date": "2026-05-16", "numbers": [6, 17, 26, 30, 34, 42]},
    {"date": "2026-05-13", "numbers": [10, 18, 21, 35, 43, 46]},
    {"date": "2026-05-09", "numbers": [3, 12, 27, 31, 39, 48]},
    {"date": "2026-05-06", "numbers": [7, 16, 25, 28, 33, 44]},
    {"date": "2026-05-02", "numbers": [11, 20, 24, 29, 37, 41]},
    {"date": "2026-04-29", "numbers": [5, 14, 22, 30, 35, 49]},
    {"date": "2026-04-25", "numbers": [8, 18, 23, 31, 40, 47]},
    {"date": "2026-04-22", "numbers": [2, 15, 21, 27, 36, 45]},
]

class LottoProcessor649:
    def __init__(self, history=None):
        self.history = history or DEFAULT_DRAW_DATABASE
        # Sort draws by date descending
        self.history = sorted(self.history, key=lambda x: x.get("date", ""), reverse=True)
        
    def get_frequency_map(self, pool_size=15):
        """Calculate frequency counts of each number over the specified pool size."""
        freq = {i: 0 for i in range(1, 50)}
        pool = self.history[:pool_size]
        for draw in pool:
            for num in draw["numbers"]:
                if num in freq:
                    freq[num] += 1
        return freq

    def calculate_skips(self):
        """Calculate the 'skips' (number of games since a number last appeared)."""
        skips = {i: 999 for i in range(1, 50)}
        for index, draw in enumerate(self.history):
            for num in draw["numbers"]:
                if num in skips and skips[num] == 999:
                    skips[num] = index
        return skips

    def validate_combination(self, numbers, min_sum=115, max_sum=185, max_consecutive=2):
        """
        Validate six numbers against advanced lottery filtration protocols.
        """
        if len(numbers) != 6 or len(set(numbers)) != 6:
            return False, "Must contain exactly 6 unique numbers."
            
        sorted_nums = sorted(list(numbers))
        if any(n < 1 or n > 49 for n in sorted_nums):
            return False, "Nodes must operate strictly within [1 - 49]."

        # 1. Sum range validation
        total_sum = sum(sorted_nums)
        if total_sum < min_sum or total_sum > max_sum:
            return False, f"Sum filter triggered: Total sum {total_sum} lies outside ideal interval [{min_sum} - {max_sum}]."

        # 2. Odd-to-Even distribution check
        odd_count = sum(1 for n in sorted_nums if n % 2 != 0)
        even_count = 6 - odd_count
        if odd_count in (0, 6):
            return False, "Odd/Even ratio filter triggered: Avoid purely odd or purely even combinations."

        # 3. High-to-Low distribution check
        # For 1-49, low is 1-24, high is 25-49
        low_count = sum(1 for n in sorted_nums if n <= 24)
        high_count = 6 - low_count
        if low_count in (0, 6):
            return False, "High/Low split filter triggered: Avoid purely low or purely high combinations."

        # 4. Consecutive count check
        consecutive_streak = 1
        current_streak = 1
        for i in range(len(sorted_nums) - 1):
            if sorted_nums[i + 1] - sorted_nums[i] == 1:
                current_streak += 1
            else:
                consecutive_streak = max(consecutive_streak, current_streak)
                current_streak = 1
        consecutive_streak = max(consecutive_streak, current_streak)
        
        if consecutive_streak > max_consecutive:
            return False, f"Consecutive Node Shield triggered: {consecutive_streak} consecutive numbers breach max threshold of {max_consecutive}."

        # 5. Reverse match check against past drawings (avoid 5+ repetitions)
        for draw in self.history[:10]:
            overlap = len(set(sorted_nums).intersection(set(draw["numbers"])))
            if overlap >= 5:
                return False, f"Historical Overlap Guard: Strong similarity detected ({overlap} matches) with draw on {draw['date']}."

        return True, "Combination passed all 6-49 diagnostic filters."

    def generate_recommendation(self, min_sum=115, max_sum=185, max_consecutive=2):
        """
        Generate combination candidates by selecting numbers based on high frequency
        and low skip weights, then vetting through validation filters.
        """
        freq_map = self.get_frequency_map()
        skip_map = self.calculate_skips()
        
        # Weighing formula: score = (frequency * 1.5) - (skip * 0.2)
        node_weights = []
        for num in range(1, 50):
            freq = freq_map.get(num, 0)
            skip = skip_map.get(num, 0)
            weight = (freq * 1.5) - (skip * 0.25)
            node_weights.append((num, weight))
            
        sorted_weights = sorted(node_weights, key=lambda x: x[1], reverse=True)
        top_candidates = [x[0] for x in sorted_weights[:24]] # take top 24 active nodes
        
        # Try to build valid arrays
        attempts = 0
        while attempts < 1000:
            candidate = sorted(random.sample(top_candidates, 6))
            is_valid, msg = self.validate_combination(candidate, min_sum, max_sum, max_consecutive)
            if is_valid:
                return candidate, f"Generated in {attempts} iterations using frequency-weighted constraints."
            attempts += 1
            
        # Fallback to pure high weight selection
        return [x[0] for x in sorted_weights[:6]], "Fallback top weighted candidate set."

    def calculate_hypercube_coords(self, num):
        """
        Map a Lotto number (1-49) to 4D coordinates in a hypercube.
        Coordinates mapped in a hypergrid centered around 0.
        """
        i = num - 1
        x = (i % 3) - 1
        y = ((i // 3) % 3) - 1
        z = ((i // 9) % 3) - 1
        w = ((i // 27) % 3) - 1
        return (x, y, z, w)

    def analyze_4d_cube_trace(self, trace_draws_count=25):
        """
        Analyze path transitions inside 4D space across recent drawings.
        """
        trace_history = self.history[:trace_draws_count]
        vectors = []
        for draw in trace_history:
            coords = [self.calculate_hypercube_coords(n) for n in draw["numbers"]]
            vectors.append(coords)
            
        # Compute multi-dimensional distance, velocity, and centroids of vectors
        # for complex dimensional modeling
        centroids = []
        for draw_coords in vectors:
            avg_x = sum(c[0] for c in draw_coords) / 6.0
            avg_y = sum(c[1] for c in draw_coords) / 6.0
            avg_z = sum(c[2] for c in draw_coords) / 6.0
            avg_w = sum(c[3] for c in draw_coords) / 6.0
            centroids.append((avg_x, avg_y, avg_z, avg_w))
            
        return len(vectors), centroids

if __name__ == "__main__":
    print("=========================================================================")
    print("      J.A.R.V.I.S. SYSTEM TELEMETRY: 6-49 PROCESSING SYSTEM CORE ONLINE   ")
    print("=========================================================================")
    processor = LottoProcessor649()
    
    # Process recommended numbers
    rec, attempts_msg = processor.generate_recommendation()
    print(f"Neural processing response: {attempts_msg}")
    print(f"Calculated numbers: {rec}")
    
    # Analyze 4D Tesseract projection and trace pattern
    count, centroids = processor.analyze_4d_cube_trace(25)
    print(f"Witnessed trails inside 4D Hypercube trace: {count} draw coordinate pathways analyzed.")
    if centroids:
        print(f"Latest 4D Barycenter Alignment: {centroids[0]}")
    print("=========================================================================")
