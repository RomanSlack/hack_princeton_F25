#!/usr/bin/env python3
"""
Benchmark script to compare speeds of OpenAI vs Daedalus LLM providers.

This script tests the response times for both providers using identical prompts
and calculates statistics to determine which is faster.
"""

import asyncio
import time
import statistics
from typing import List, Dict, Any
from dotenv import load_dotenv
import os
import logging

# Import the LLM providers from main
from main import OpenAIProvider, DaedalusProvider, LLMProvider

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test prompts - varying complexity
TEST_PROMPTS = [
    "What is 2+2?",
    "Explain what an AI agent is in one sentence.",
    "You are in a game. You can move, attack, or collect. Your health is 80/100. There is an enemy 10 units away. What should you do? Respond with JSON: {\"action\": \"move/attack/collect\", \"reasoning\": \"why\"}",
    "Describe the concept of reinforcement learning in 3 sentences.",
    "You are an AI agent in a multiplayer game. Current state: position (100, 200), health 75/100, ammo 3/10, enemy at (120, 210) with 50 health. Available actions: move (x, y), attack (target_id), collect, switch_weapon. Choose the best action and explain. Format: {\"action\": \"...\", \"parameters\": {...}, \"reasoning\": \"...\"}",
]

# Test models
OPENAI_MODEL = "gpt-4o-mini"  # Fast OpenAI model
DAEDALUS_MODEL = "openai/gpt-4o-mini"  # Daedalus routing through OpenAI


class BenchmarkResult:
    """Store results from a benchmark run"""
    def __init__(self, provider_name: str, model: str):
        self.provider_name = provider_name
        self.model = model
        self.response_times: List[float] = []
        self.errors: List[str] = []
        self.responses: List[str] = []

    def add_result(self, response_time: float, response: str = "", error: str = ""):
        if error:
            self.errors.append(error)
        else:
            self.response_times.append(response_time)
            self.responses.append(response)

    def get_stats(self) -> Dict[str, Any]:
        if not self.response_times:
            return {
                "provider": self.provider_name,
                "model": self.model,
                "error": "No successful requests",
                "error_count": len(self.errors)
            }

        return {
            "provider": self.provider_name,
            "model": self.model,
            "num_requests": len(self.response_times),
            "num_errors": len(self.errors),
            "mean_time": statistics.mean(self.response_times),
            "median_time": statistics.median(self.response_times),
            "min_time": min(self.response_times),
            "max_time": max(self.response_times),
            "std_dev": statistics.stdev(self.response_times) if len(self.response_times) > 1 else 0,
            "total_time": sum(self.response_times)
        }


async def benchmark_provider(
    provider: LLMProvider,
    provider_name: str,
    model: str,
    prompts: List[str],
    timeout: float = 30.0
) -> BenchmarkResult:
    """
    Benchmark a single provider with multiple prompts.

    Args:
        provider: The LLM provider to test
        provider_name: Name for display (e.g., "OpenAI Direct", "Daedalus")
        model: Model name to use
        prompts: List of test prompts
        timeout: Timeout for each request

    Returns:
        BenchmarkResult with timing data
    """
    result = BenchmarkResult(provider_name, model)

    logger.info(f"\n{'='*60}")
    logger.info(f"Benchmarking {provider_name} with model {model}")
    logger.info(f"{'='*60}")

    for i, prompt in enumerate(prompts, 1):
        try:
            logger.info(f"\n[{i}/{len(prompts)}] Testing prompt: {prompt[:50]}...")

            start_time = time.perf_counter()
            response = await provider.run(
                input=prompt,
                model=model,
                timeout=timeout
            )
            elapsed_time = time.perf_counter() - start_time

            result.add_result(elapsed_time, response.final_output)
            logger.info(f"✓ Completed in {elapsed_time:.3f}s")
            logger.info(f"  Response: {response.final_output[:100]}...")

        except Exception as e:
            logger.error(f"✗ Error: {str(e)}")
            result.add_result(0, error=str(e))

    return result


async def run_benchmark(num_iterations: int = 1):
    """
    Run the full benchmark comparing OpenAI and Daedalus.

    Args:
        num_iterations: Number of times to run through all test prompts
    """
    logger.info(f"\n{'#'*60}")
    logger.info(f"LLM PROVIDER SPEED BENCHMARK")
    logger.info(f"{'#'*60}")
    logger.info(f"Iterations: {num_iterations}")
    logger.info(f"Test prompts: {len(TEST_PROMPTS)}")
    logger.info(f"Total requests per provider: {len(TEST_PROMPTS) * num_iterations}")

    # Initialize providers
    providers = []

    # Try to initialize OpenAI
    try:
        if os.getenv("OPENAI_API_KEY"):
            openai_provider = OpenAIProvider()
            providers.append((openai_provider, "OpenAI Direct", OPENAI_MODEL))
            logger.info("✓ OpenAI provider initialized")
        else:
            logger.warning("⚠ OPENAI_API_KEY not found, skipping OpenAI tests")
    except Exception as e:
        logger.error(f"✗ Failed to initialize OpenAI provider: {e}")

    # Try to initialize Daedalus
    try:
        if os.getenv("DEDALUS_API_KEY"):
            daedalus_provider = DaedalusProvider()
            providers.append((daedalus_provider, "Daedalus", DAEDALUS_MODEL))
            logger.info("✓ Daedalus provider initialized")
        else:
            logger.warning("⚠ DEDALUS_API_KEY not found, skipping Daedalus tests")
    except Exception as e:
        logger.error(f"✗ Failed to initialize Daedalus provider: {e}")

    if not providers:
        logger.error("No providers available to test. Please set OPENAI_API_KEY and/or DEDALUS_API_KEY")
        return

    # Run benchmarks for all iterations
    all_results = {name: [] for _, name, _ in providers}

    for iteration in range(num_iterations):
        logger.info(f"\n{'='*60}")
        logger.info(f"ITERATION {iteration + 1}/{num_iterations}")
        logger.info(f"{'='*60}")

        for provider, name, model in providers:
            result = await benchmark_provider(provider, name, model, TEST_PROMPTS)
            all_results[name].append(result)

    # Aggregate and display results
    logger.info(f"\n{'#'*60}")
    logger.info(f"BENCHMARK RESULTS SUMMARY")
    logger.info(f"{'#'*60}\n")

    comparison_data = []

    for provider_name in all_results:
        results = all_results[provider_name]

        # Combine all response times across iterations
        all_times = []
        all_errors = []
        for result in results:
            all_times.extend(result.response_times)
            all_errors.extend(result.errors)

        if not all_times:
            logger.error(f"\n{provider_name}: NO SUCCESSFUL REQUESTS")
            logger.error(f"  Total errors: {len(all_errors)}")
            continue

        stats = {
            "provider": provider_name,
            "total_requests": len(all_times),
            "total_errors": len(all_errors),
            "mean_time": statistics.mean(all_times),
            "median_time": statistics.median(all_times),
            "min_time": min(all_times),
            "max_time": max(all_times),
            "std_dev": statistics.stdev(all_times) if len(all_times) > 1 else 0,
            "total_time": sum(all_times)
        }

        comparison_data.append(stats)

        logger.info(f"\n{provider_name}:")
        logger.info(f"  Total requests:  {stats['total_requests']}")
        logger.info(f"  Successful:      {stats['total_requests'] - stats['total_errors']}")
        logger.info(f"  Errors:          {stats['total_errors']}")
        logger.info(f"  Mean time:       {stats['mean_time']:.3f}s")
        logger.info(f"  Median time:     {stats['median_time']:.3f}s")
        logger.info(f"  Min time:        {stats['min_time']:.3f}s")
        logger.info(f"  Max time:        {stats['max_time']:.3f}s")
        logger.info(f"  Std deviation:   {stats['std_dev']:.3f}s")
        logger.info(f"  Total time:      {stats['total_time']:.3f}s")

    # Compare providers
    if len(comparison_data) >= 2:
        logger.info(f"\n{'='*60}")
        logger.info("COMPARISON")
        logger.info(f"{'='*60}\n")

        # Sort by mean time
        sorted_data = sorted(comparison_data, key=lambda x: x['mean_time'])
        fastest = sorted_data[0]
        slowest = sorted_data[-1]

        speedup = slowest['mean_time'] / fastest['mean_time']
        time_diff = slowest['mean_time'] - fastest['mean_time']

        logger.info(f"🏆 WINNER: {fastest['provider']}")
        logger.info(f"   Mean response time: {fastest['mean_time']:.3f}s")
        logger.info(f"\n📊 {fastest['provider']} is {speedup:.2f}x FASTER than {slowest['provider']}")
        logger.info(f"   Time difference: {time_diff:.3f}s per request")
        logger.info(f"   ({time_diff * 100:.1f}s saved per 100 requests)")

        # Calculate total time savings
        total_requests = fastest['total_requests']
        total_savings = time_diff * total_requests
        logger.info(f"\n💰 Total time saved in this benchmark: {total_savings:.2f}s")

    logger.info(f"\n{'#'*60}")
    logger.info("BENCHMARK COMPLETE")
    logger.info(f"{'#'*60}\n")


def main():
    """Main entry point for the benchmark script"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Benchmark OpenAI vs Daedalus LLM provider speeds"
    )
    parser.add_argument(
        "--iterations",
        type=int,
        default=1,
        help="Number of iterations to run (default: 1)"
    )

    args = parser.parse_args()

    # Run the benchmark
    asyncio.run(run_benchmark(num_iterations=args.iterations))


if __name__ == "__main__":
    main()