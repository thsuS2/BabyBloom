/**
 * SVG 기반 듀얼 라인 차트
 * 의존성: react-native, react-native-svg
 * 특징: 2개 라인 비교, 범례, 겹침 방지 툴팁 (점수 차이 20 이하일 때)
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface DualLineDataSet {
    data: Array<[string, number]>;
    color: string;
    fillColor?: string;
    label: string;
}

export interface SVGDualLineChartColors {
    axis?: string;
    grid?: string;
    tooltipText?: string;
    labelText?: string;
    legendText?: string;
    loadingText?: string;
}

interface SVGDualLineChartProps {
    line1: DualLineDataSet;
    line2: DualLineDataSet;
    width: number;
    height?: number;
    maxValue?: number;
    unit?: string;
    colors?: SVGDualLineChartColors;
}

const DEFAULT_COLORS: SVGDualLineChartColors = {
    axis: '#E5E5E5',
    grid: '#E5E5E5',
    tooltipText: '#FFFFFF',
    labelText: '#999999',
    legendText: '#333333',
    loadingText: '#999999',
};

const SVGDualLineChartComponent = ({
    line1,
    line2,
    width,
    height = 150,
    maxValue = 100,
    unit = '점',
    colors: colorsProp,
}: SVGDualLineChartProps) => {
    const c = { ...DEFAULT_COLORS, ...colorsProp };
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const chartWidth = width * 0.85;
    const chartPadding = { top: 10, right: 5, bottom: 5, left: 5 };
    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = height - chartPadding.top - chartPadding.bottom;

    const calculatePoints = (data: Array<[string, number]>) => {
        if (data.length === 0) return [];

        const spacing = innerWidth / Math.max(data.length - 1, 1);

        return data.map(([label, value], i) => ({
            x: chartPadding.left + (data.length === 1 ? innerWidth / 2 : i * spacing),
            y: chartPadding.top + innerHeight - (value / maxValue) * innerHeight,
            label,
            value,
        }));
    };

    const line1Points = useMemo(() => calculatePoints(line1.data), [line1.data, innerWidth, innerHeight, maxValue]);
    const line2Points = useMemo(() => calculatePoints(line2.data), [line2.data, innerWidth, innerHeight, maxValue]);

    const createLinePath = (points: typeof line1Points) => {
        if (points.length === 0) return '';

        const firstPoint = points[0];
        if (!firstPoint) return '';

        let path = `M ${firstPoint.x} ${firstPoint.y}`;
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
                path += ` L ${point.x} ${point.y}`;
            }
        }
        return path;
    };

    const createAreaPath = (points: typeof line1Points) => {
        if (points.length === 0) return '';

        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        if (!firstPoint || !lastPoint) return '';

        const bottomY = chartPadding.top + innerHeight;
        let path = `M ${firstPoint.x} ${bottomY}`;
        path += ` L ${firstPoint.x} ${firstPoint.y}`;

        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point) {
                path += ` L ${point.x} ${point.y}`;
            }
        }

        path += ` L ${lastPoint.x} ${bottomY}`;
        path += ' Z';
        return path;
    };

    const line1LinePath = useMemo(() => createLinePath(line1Points), [line1Points]);
    const line2LinePath = useMemo(() => createLinePath(line2Points), [line2Points]);
    const line1AreaPath = useMemo(() => createAreaPath(line1Points), [line1Points]);
    const line2AreaPath = useMemo(() => createAreaPath(line2Points), [line2Points]);

    const handlePointPress = (index: number) => {
        setSelectedIndex(selectedIndex === index ? null : index);
    };

    if (line1.data.length === 0) {
        return (
            <View style={{ height: height + 60, width: chartWidth, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: c.loadingText, fontSize: 13 }}>차트 로딩중...</Text>
            </View>
        );
    }

    const line1FillColor = line1.fillColor || line1.color;
    const line2FillColor = line2.fillColor || line2.color;

    return (
        <View style={[styles.container, { width: chartWidth, height: height + 60 }]}>
            <Svg width={chartWidth} height={height}>
                <Defs>
                    <LinearGradient id="dualLine1Gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={line1FillColor} stopOpacity="0.4" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
                    </LinearGradient>
                    <LinearGradient id="dualLine2Gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={line2FillColor} stopOpacity="0.3" />
                        <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
                    </LinearGradient>
                </Defs>

                {/* X축 라인 */}
                <Line
                    x1={chartPadding.left}
                    y1={chartPadding.top + innerHeight}
                    x2={chartWidth - chartPadding.right}
                    y2={chartPadding.top + innerHeight}
                    stroke={c.axis}
                    strokeWidth={1}
                />

                {/* 세로 점선 그리드 */}
                {line1Points.map((point, index) => (
                    <Line
                        key={`y-strip-${index}`}
                        x1={point.x}
                        y1={chartPadding.top}
                        x2={point.x}
                        y2={chartPadding.top + innerHeight}
                        stroke={c.grid}
                        strokeWidth={1}
                        strokeDasharray="3,3"
                    />
                ))}

                {/* line2 영역 (뒤에 먼저) */}
                {line2AreaPath && (
                    <Path d={line2AreaPath} fill="url(#dualLine2Gradient)" />
                )}

                {/* line1 영역 */}
                {line1AreaPath && (
                    <Path d={line1AreaPath} fill="url(#dualLine1Gradient)" />
                )}

                {/* line2 라인 */}
                {line2LinePath && (
                    <Path d={line2LinePath} stroke={line2.color} strokeWidth={3} fill="none" />
                )}

                {/* line1 라인 */}
                {line1LinePath && (
                    <Path d={line1LinePath} stroke={line1.color} strokeWidth={3} fill="none" />
                )}

                {/* line2 데이터 포인트 */}
                {line2Points.map((point, index) => (
                    <Circle
                        key={`line2-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={selectedIndex === index ? 6 : 4}
                        fill={line2.color}
                    />
                ))}

                {/* line1 데이터 포인트 */}
                {line1Points.map((point, index) => (
                    <Circle
                        key={`line1-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={selectedIndex === index ? 6 : 4}
                        fill={line1.color}
                    />
                ))}
            </Svg>

            {/* 터치 영역 및 툴팁 */}
            {line1Points.map((point1, index) => {
                const point2 = line2Points[index];
                const isFirstData = index === 0;
                const isLastData = index === line1Points.length - 1;

                const topY = Math.min(point1.y, point2?.y ?? point1.y);
                const touchAreaTop = topY - 25;

                const scoreDiff = Math.abs(point1.value - (point2?.value ?? 0));
                const isClose = scoreDiff <= 20;

                const isHighScore = point1.value >= maxValue * 0.85 || (point2?.value ?? 0) >= maxValue * 0.85;
                const useSideBySide = !isFirstData && isHighScore && isClose;

                let line1TooltipLeft = 5;
                let line2TooltipLeft = 5;
                if (isFirstData) {
                    line1TooltipLeft = 30;
                    line2TooltipLeft = 30;
                } else if (isLastData) {
                    line1TooltipLeft = -10;
                    line2TooltipLeft = -10;
                }

                if (useSideBySide) {
                    line1TooltipLeft = -25;
                    line2TooltipLeft = 30;
                }

                const line1RelativeTop = point1.y - touchAreaTop;
                const line2RelativeTop = (point2?.y ?? point1.y) - touchAreaTop;

                const tooltipHeight = 25;
                const tooltipGap = 5;

                let line1TooltipTop = line1RelativeTop - tooltipHeight - tooltipGap;
                let line2TooltipTop = line2RelativeTop - tooltipHeight - tooltipGap;

                if (isClose && point2 && !useSideBySide) {
                    const lowerRelativeTop = Math.max(line1RelativeTop, line2RelativeTop);
                    const lowerTooltipTop = lowerRelativeTop - tooltipHeight - tooltipGap;
                    const higherTooltipTop = lowerTooltipTop - 25;

                    if (point1.value >= (point2.value ?? 0)) {
                        line1TooltipTop = higherTooltipTop;
                        line2TooltipTop = lowerTooltipTop;
                    } else {
                        line2TooltipTop = higherTooltipTop;
                        line1TooltipTop = lowerTooltipTop;
                    }
                }

                return (
                    <TouchableOpacity
                        key={`touch-${index}`}
                        style={[
                            styles.touchArea,
                            {
                                left: point1.x - 25,
                                top: touchAreaTop,
                                width: 50,
                                height: Math.abs(point1.y - (point2?.y ?? point1.y)) + 50,
                            }
                        ]}
                        onPress={() => handlePointPress(index)}
                        activeOpacity={0.7}
                    >
                        {selectedIndex === index && (
                            <>
                                {/* line1 툴팁 */}
                                <View style={[
                                    styles.tooltip,
                                    {
                                        position: 'absolute',
                                        top: line1TooltipTop,
                                        left: line1TooltipLeft,
                                        backgroundColor: line1.color,
                                    }
                                ]}>
                                    <Text style={[styles.tooltipText, { color: c.tooltipText }]}>
                                        {point1.value}{unit}
                                    </Text>
                                </View>
                                {/* line2 툴팁 */}
                                {point2 && (
                                    <View style={[
                                        styles.tooltip,
                                        {
                                            position: 'absolute',
                                            top: line2TooltipTop,
                                            left: line2TooltipLeft,
                                            backgroundColor: line2.color,
                                        }
                                    ]}>
                                        <Text style={[styles.tooltipText, { color: c.tooltipText }]}>
                                            {point2.value}{unit}
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </TouchableOpacity>
                );
            })}

            {/* X축 라벨 */}
            {line1Points.map((point, index) => {
                const isFirst = index === 0;
                const isLast = index === line1Points.length - 1;
                const translateX = isFirst ? -5 : isLast ? -15 : -10;

                return (
                    <Text
                        key={`label-${index}`}
                        style={{
                            position: 'absolute',
                            left: point.x,
                            top: height + 5,
                            transform: [{ translateX }],
                            fontSize: 11,
                            color: c.labelText,
                        }}
                    >
                        {point.label}
                    </Text>
                );
            })}

            {/* 범례 */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: line1.color }]} />
                    <Text style={[styles.legendText, { color: c.legendText }]}>{line1.label}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: line2.color }]} />
                    <Text style={[styles.legendText, { color: c.legendText }]}>{line2.label}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginTop: 10,
        paddingLeft: 5,
    },
    touchArea: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 40,
    },
    tooltipText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 5,
        gap: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        fontSize: 11,
    },
});

export const SVGDualLineChart = React.memo(
    SVGDualLineChartComponent,
    (prevProps, nextProps) => {
        return JSON.stringify(prevProps.line1) === JSON.stringify(nextProps.line1)
            && JSON.stringify(prevProps.line2) === JSON.stringify(nextProps.line2)
            && prevProps.width === nextProps.width
            && prevProps.height === nextProps.height;
    }
);
