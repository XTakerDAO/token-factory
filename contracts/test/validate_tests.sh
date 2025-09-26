#!/bin/bash

# ERC20Template测试验证脚本
# 用于验证测试文件语法和结构

set -e

echo "🔍 验证 ERC20Template 测试文件..."
echo "===================================="

# 检查测试文件是否存在
echo "📁 检查测试文件存在性..."
test_files=(
    "ERC20Template.t.sol"
    "ERC20TemplateAdvanced.t.sol"
    "ERC20TemplateInit.t.sol"
)

for file in "${test_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file - 存在"
    else
        echo "❌ $file - 不存在"
        exit 1
    fi
done

echo ""
echo "📊 测试文件统计..."
echo "===================================="

for file in "${test_files[@]}"; do
    lines=$(wc -l < "$file")
    functions=$(grep -c "function test" "$file" || echo "0")
    contracts=$(grep -c "contract.*Test" "$file" || echo "0")

    echo "$file:"
    echo "  - 行数: $lines"
    echo "  - 测试函数: $functions"
    echo "  - 测试合约: $contracts"
    echo ""
done

# 检查Solidity版本兼容性
echo "🔧 检查 Solidity 版本兼容性..."
echo "===================================="

for file in "${test_files[@]}"; do
    version=$(head -5 "$file" | grep "pragma solidity" | head -1 | grep -o "\^[0-9]\+\.[0-9]\+\.[0-9]\+" || echo "未找到")
    echo "$file: $version"
done

echo ""
echo "📋 检查测试结构模式..."
echo "===================================="

# 检查关键测试模式
patterns=(
    "setUp()"
    "test_.*Basic"
    "test_.*OnlyOwner"
    "test_.*Initialize"
    "testFuzz_"
    "invariant_"
    "vm\.expectRevert"
    "vm\.expectEmit"
    "assertEq"
    "assertTrue"
    "assertFalse"
)

for file in "${test_files[@]}"; do
    echo "检查 $file:"
    for pattern in "${patterns[@]}"; do
        count=$(grep -c "$pattern" "$file" || echo "0")
        if [[ $count -gt 0 ]]; then
            echo "  ✅ $pattern: $count"
        fi
    done
    echo ""
done

echo "🎯 检查 TDD 模式合规性..."
echo "===================================="

# 检查每个文件是否有Mock合约（应该存在以确保测试失败）
for file in "${test_files[@]}"; do
    mock_contracts=$(grep -c "contract Mock" "$file" || echo "0")
    if [[ $mock_contracts -gt 0 ]]; then
        echo "✅ $file: 包含 $mock_contracts 个 Mock 合约 (TDD 合规)"
    else
        echo "⚠️  $file: 未找到 Mock 合约"
    fi
done

echo ""
echo "🌐 检查 XSC 网络兼容性标记..."
echo "===================================="

xsc_patterns=(
    "XSC_"
    "xsc"
    "Gas.*XSC"
    "network.*XSC"
)

for file in "${test_files[@]}"; do
    echo "检查 $file XSC 兼容性:"
    for pattern in "${xsc_patterns[@]}"; do
        count=$(grep -c "$pattern" "$file" || echo "0")
        if [[ $count -gt 0 ]]; then
            echo "  ✅ $pattern: $count"
        fi
    done
done

echo ""
echo "🔐 检查安全测试覆盖..."
echo "===================================="

security_patterns=(
    "onlyOwner"
    "NotOwner"
    "zero address"
    "overflow"
    "underflow"
    "reentrancy"
    "pause"
    "access control"
)

for file in "${test_files[@]}"; do
    echo "检查 $file 安全测试:"
    for pattern in "${security_patterns[@]}"; do
        count=$(grep -ci "$pattern" "$file" || echo "0")
        if [[ $count -gt 0 ]]; then
            echo "  ✅ $pattern: $count"
        fi
    done
done

echo ""
echo "📈 测试覆盖范围摘要..."
echo "===================================="

total_functions=0
total_lines=0

for file in "${test_files[@]}"; do
    lines=$(wc -l < "$file")
    functions=$(grep -c "function test" "$file" || echo "0")
    total_lines=$((total_lines + lines))
    total_functions=$((total_functions + functions))
done

echo "总计:"
echo "  - 测试文件: ${#test_files[@]}"
echo "  - 总行数: $total_lines"
echo "  - 总测试函数: $total_functions"
echo "  - 平均每文件: $((total_functions / ${#test_files[@]})) 个测试"

echo ""
echo "✅ 验证完成！"
echo "===================================="
echo ""
echo "📋 下一步:"
echo "1. 安装 Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup"
echo "2. 运行测试(预期失败): forge test --match-path 'test/ERC20Template*.sol'"
echo "3. 实现 IERC20Template 接口"
echo "4. 实现 ERC20Template 合约"
echo "5. 迭代直到所有测试通过"
echo ""
echo "⚠️  注意: 由于采用 TDD 方法，在实现完成前所有测试都应该失败。"